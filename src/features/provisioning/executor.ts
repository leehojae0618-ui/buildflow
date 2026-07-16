import "server-only";

import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { executionTasksFromBuildPlan } from "@/features/execution/planner";
import { completionReport, estimateBuild } from "@/features/deployment/engine";
import { resolveProviderCredential } from "@/features/credentials/repository";
import {
  calculateFinalVerificationResult,
  createVerificationRun,
  verificationRunStatus,
} from "@/features/verification/runner";
import { persistVerificationRun } from "@/features/verification/repository";
import type {
  VerificationAttempt,
  VerificationTarget,
} from "@/features/verification/types";
import { finalizeFatigueMetrics } from "@/features/autonomous/state-machine";
import type { FatigueMetrics } from "@/features/autonomous/types";
import { commandFromPlan } from "./commands";
import { providerAdapters } from "./adapters";
import {
  BlueprintSelectionError,
  generateApplicationBlueprint,
  type GeneratedApplication,
} from "./blueprints";
import { serviceSlug } from "./service-template";
import type {
  CommandResult,
  ProviderCredentialResolver,
  ProvisioningCommand,
} from "./types";

const maxDeploymentChecks = 20;

type OwnedContext = Awaited<ReturnType<typeof ownedContext>>;

async function ownedContext(
  projectId: string,
  sessionId: string,
  trustedUserId?: string,
) {
  const client = trustedUserId
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();
  const user = trustedUserId
    ? { id: trustedUserId }
    : (await client.auth.getUser()).data.user;
  if (!user) return null;
  const { data: project } = await client
    .from("projects")
    .select("id,user_id,title,goal,goal_description,goal_constraints")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return null;
  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from("autonomous_build_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return session ? { supabase, user, project, session } : null;
}

function commandChecksum(command: ProvisioningCommand) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        provider: command.provider,
        kind: command.kind,
        payload: command.payload,
        approvalScope: command.approvalScope,
      }),
    )
    .digest("hex");
}

function resultFromJson(value: unknown): CommandResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Partial<CommandResult>;
  if (
    typeof result.ok !== "boolean" ||
    !["PREPARED", "SUCCEEDED", "WAITING_FOR_USER", "FAILED"].includes(
      String(result.status),
    )
  ) {
    return null;
  }
  return result as CommandResult;
}

async function executeCommand(
  access: NonNullable<OwnedContext>,
  command: ProvisioningCommand,
  resolver: ProviderCredentialResolver,
  verify = true,
): Promise<CommandResult> {
  const checksum = commandChecksum(command);
  const { data: existing } = await access.supabase
    .from("provider_command_runs")
    .select("*")
    .eq("project_id", command.projectId)
    .eq("command_id", command.id)
    .maybeSingle();
  const existingResult = resultFromJson(existing?.safe_result);
  if (
    existing?.status === "SUCCEEDED" &&
    existing.payload_checksum === checksum &&
    existingResult
  ) {
    return existingResult;
  }
  const attemptLimit =
    command.kind === "CHECK_DEPLOYMENT_STATUS" ? maxDeploymentChecks : 2;
  if ((existing?.attempt_number ?? 0) >= attemptLimit && existingResult) {
    return {
      ...existingResult,
      ok: false,
      status: "FAILED",
      safeCode: `${command.provider.toUpperCase()}_RETRY_EXHAUSTED`,
      retryable: false,
    };
  }

  const adapter = providerAdapters[command.provider];
  const validation = await adapter.validateCommand(command);
  if (!validation.ok) return adapter.sanitizeResult(validation);

  const nextAttempt = Math.min((existing?.attempt_number ?? 0) + 1, 25);
  const baseRow = {
    project_id: command.projectId,
    user_id: access.user.id,
    autonomous_session_id: access.session.id,
    execution_id: access.session.execution_id,
    command_id: command.id,
    provider: command.provider,
    command_kind: command.kind,
    approval_scope: command.approvalScope,
    payload_checksum: checksum,
    status: "RUNNING",
    attempt_number: nextAttempt,
    safe_result: {},
    started_at: new Date().toISOString(),
    completed_at: null,
  };
  if (existing) {
    await access.supabase
      .from("provider_command_runs")
      .update(baseRow)
      .eq("id", existing.id)
      .eq("user_id", access.user.id);
  } else {
    await access.supabase.from("provider_command_runs").insert(baseRow);
  }

  let result = await adapter.executeCommand(command, resolver);
  if (verify && result.ok) {
    result = await adapter.verifyCommand(command, result, resolver);
  }
  const sanitized = adapter.sanitizeResult(result);
  const status = sanitized.ok
    ? "SUCCEEDED"
    : sanitized.status === "WAITING_FOR_USER"
      ? "WAITING_FOR_USER"
      : "FAILED";
  await access.supabase
    .from("provider_command_runs")
    .update({
      status,
      safe_result: sanitized as never,
      completed_at: new Date().toISOString(),
    })
    .eq("project_id", command.projectId)
    .eq("command_id", command.id)
    .eq("user_id", access.user.id);
  if (sanitized.ok) {
    await access.supabase
      .from("provider_credentials")
      .update({
        status: "VALID",
        last_validated_at: new Date().toISOString(),
      })
      .eq("project_id", command.projectId)
      .eq("user_id", access.user.id)
      .eq("provider", command.provider);
  } else if (
    sanitized.safeCode?.includes("AUTHENTICATION_FAILED") ||
    sanitized.safeCode?.includes("PERMISSION_DENIED")
  ) {
    await access.supabase
      .from("provider_credentials")
      .update({ status: "INVALID" })
      .eq("project_id", command.projectId)
      .eq("user_id", access.user.id)
      .eq("provider", command.provider);
  }
  return sanitized;
}

async function ensureExecution(access: NonNullable<OwnedContext>) {
  if (access.session.execution_id) return access.session.execution_id;
  const constraints = (access.project.goal_constraints ?? {}) as Record<
    string,
    unknown
  >;
  const snapshot = (constraints.requirement_snapshot ?? {}) as Record<
    string,
    unknown
  >;
  const buildPlan = snapshot.buildPlan as
    | Parameters<typeof executionTasksFromBuildPlan>[0]
    | undefined;
  const architecture = snapshot.selectedArchitectureSnapshot as
    | Parameters<typeof executionTasksFromBuildPlan>[1]
    | undefined;
  const selectedCandidateId =
    typeof snapshot.selectedCandidateId === "string"
      ? snapshot.selectedCandidateId
      : "autonomous-selected";
  if (!buildPlan || !architecture) return null;
  const planned = executionTasksFromBuildPlan(
    buildPlan,
    architecture,
    selectedCandidateId,
  );
  const idempotencyKey = `autonomous-${access.session.id}`;
  const { data: existing } = await access.supabase
    .from("build_executions")
    .select("id")
    .eq("project_id", access.project.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: execution } = await access.supabase
    .from("build_executions")
    .insert({
      project_id: access.project.id,
      user_id: access.user.id,
      idempotency_key: idempotencyKey,
      status: "RUNNING",
      selected_candidate_id: selectedCandidateId,
      selected_strategy: String(snapshot.selectedStrategy ?? "BALANCED"),
      architecture_snapshot: architecture as never,
      build_plan_snapshot: buildPlan as never,
    })
    .select("id")
    .single();
  if (!execution) return null;
  if (planned.tasks.length) {
    await access.supabase.from("execution_tasks").insert(
      planned.tasks.map((task) => ({
        execution_id: execution.id,
        task_key: task.taskKey,
        title: task.title,
        action: task.action,
        status: task.action === "AUTO" ? "RUNNING" : task.status,
        dependency_keys: task.dependencyKeys,
        retry_count: task.retryCount,
        max_retries: task.maxRetries,
        artifact_manifest: task.artifactManifest,
      })),
    );
  }
  await access.supabase
    .from("autonomous_build_sessions")
    .update({ execution_id: execution.id })
    .eq("id", access.session.id)
    .eq("user_id", access.user.id);
  access.session.execution_id = execution.id;
  return execution.id;
}

async function ensureDeploymentSession(access: NonNullable<OwnedContext>) {
  const { data: existing } = await access.supabase
    .from("deployment_sessions")
    .select("*")
    .eq("project_id", access.project.id)
    .eq("user_id", access.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;
  const constraints = (access.project.goal_constraints ?? {}) as Record<
    string,
    unknown
  >;
  const snapshot = (constraints.requirement_snapshot ?? {}) as Record<
    string,
    unknown
  >;
  if (!snapshot.architecture || !snapshot.buildPlan) return null;
  const estimate = estimateBuild(
    snapshot.architecture as Parameters<typeof estimateBuild>[0],
    snapshot.buildPlan as Parameters<typeof estimateBuild>[1],
    snapshot.buildPreference as Parameters<typeof estimateBuild>[2],
  );
  const { data } = await access.supabase
    .from("deployment_sessions")
    .insert({
      project_id: access.project.id,
      user_id: access.user.id,
      state: "BUILDING",
      current_stage: "AI가 서비스 코드를 준비하고 있습니다.",
      completed_stages: ["PREPARING"],
      estimate: estimate as never,
      completion_report: {
        state: "BUILDING",
        productionReady: false,
        warnings: [],
      } as never,
    })
    .select("*")
    .single();
  return data;
}

function failureStatus(result: CommandResult) {
  return result.status === "WAITING_FOR_USER"
    ? "WAITING_FOR_CREDENTIAL"
    : result.retryable
      ? "RECOVERING"
      : "FAILED";
}

async function stopWithResult(
  access: NonNullable<OwnedContext>,
  result: CommandResult,
) {
  const status = failureStatus(result);
  await access.supabase
    .from("autonomous_build_sessions")
    .update({
      status,
      blocked_reason: result.safeCode ?? "PROVISIONING_FAILED",
      next_user_action:
        status === "WAITING_FOR_CREDENTIAL"
          ? { kind: "CREDENTIAL", label: "연결 정보를 다시 확인해 주세요." }
          : null,
    })
    .eq("id", access.session.id)
    .eq("user_id", access.user.id);
  if (access.session.execution_id && status === "FAILED") {
    await access.supabase
      .from("build_executions")
      .update({ status: "FAILED" })
      .eq("id", access.session.execution_id)
      .eq("user_id", access.user.id);
  }
  return { ok: false as const, status, error: result.safeCode ?? status };
}

export async function runAutonomousProvisioning(
  projectId: string,
  sessionId: string,
  trustedUserId?: string,
) {
  const access = await ownedContext(projectId, sessionId, trustedUserId);
  if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
  if (!["PROVISIONING", "RECOVERING"].includes(access.session.status)) {
    return {
      ok: false as const,
      error: "SESSION_NOT_READY_FOR_PROVISIONING",
    };
  }
  const approval = access.session.approval_plan as {
    scopeVersion?: string;
    publicDeployment?: boolean;
  };
  if (
    !approval.scopeVersion ||
    approval.publicDeployment !== true ||
    !access.session.approval_granted_at ||
    access.session.approval_scope_version !== approval.scopeVersion
  ) {
    return { ok: false as const, error: "APPROVAL_SCOPE_INCOMPLETE" };
  }
  const executionId = await ensureExecution(access);
  const deployment = await ensureDeploymentSession(access);
  if (!executionId || !deployment) {
    return { ok: false as const, error: "BUILD_INPUT_INCOMPLETE" };
  }

  const cache = new Map<string, Record<string, string> | null>();
  const resolver: ProviderCredentialResolver = {
    referenceId: `project-${projectId}`,
    resolve: async (provider = "github") => {
      if (!cache.has(provider)) {
        cache.set(
          provider,
          await resolveProviderCredential(projectId, access.user.id, provider),
        );
      }
      return cache.get(provider) ?? null;
    },
  };
  const goal =
    access.project.goal_description ??
    access.project.goal ??
    access.project.title;
  const projectConstraints = (access.project.goal_constraints ?? {}) as Record<
    string,
    unknown
  >;
  const requirementSnapshot = (projectConstraints.requirement_snapshot ??
    {}) as Record<string, unknown>;
  let template: GeneratedApplication;
  try {
    template = generateApplicationBlueprint({
      projectId,
      title: access.project.title,
      goal,
      requestedCapabilities: Array.isArray(
        requirementSnapshot.applicationCapabilities,
      )
        ? (requirementSnapshot.applicationCapabilities as GeneratedApplication["capabilities"])
        : undefined,
    });
  } catch (error) {
    return stopWithResult(access, {
      ok: false,
      status: "FAILED",
      safeCode:
        error instanceof BlueprintSelectionError
          ? error.code
          : "BLUEPRINT_GENERATION_FAILED",
      retryable: false,
    });
  }
  const githubCredential = await resolver.resolve("github");
  const repo = serviceSlug(access.project.title, projectId);
  const scope = approval.scopeVersion;

  const createRepository = commandFromPlan(
    projectId,
    "github",
    "CREATE_REPOSITORY",
    {
      repo,
      private: true,
      description: `BuildFlow generated service for ${access.project.title}`,
    },
    scope,
  );
  const repositoryResult = await executeCommand(
    access,
    createRepository,
    resolver,
  );
  if (!repositoryResult.ok) return stopWithResult(access, repositoryResult);
  const repository =
    repositoryResult.url?.replace(/^https:\/\/github\.com\//, "") ??
    `${githubCredential?.owner ?? ""}/${repo}`;
  if (!repository.includes("/")) {
    return stopWithResult(access, {
      ok: false,
      status: "FAILED",
      safeCode: "GITHUB_OWNER_REQUIRED",
      retryable: false,
    });
  }

  const commands: ProvisioningCommand[] = [
    commandFromPlan(
      projectId,
      "github",
      "UPSERT_FILES",
      {
        repo,
        files: template.files,
        repositoryUrl: repositoryResult.url ?? "",
      },
      scope,
    ),
    commandFromPlan(
      projectId,
      "supabase",
      "VALIDATE_PROJECT",
      { project: "existing-test-project" },
      scope,
    ),
    ...(template.blueprintId === "general-crud-v1"
      ? [
          commandFromPlan(
            projectId,
            "supabase",
            "CONFIGURE_AUTH",
            {
              allowEmailSignup: true,
              mailerAutoconfirm: true,
              blueprintId: template.blueprintId,
            },
            scope,
          ),
        ]
      : []),
    commandFromPlan(
      projectId,
      "supabase",
      "APPLY_SQL_SCHEMA",
      {
        sql: template.sql,
        schemaChecksum: template.checksum,
        expectedTables: template.verification.expectedTables,
        blueprintId: template.blueprintId,
      },
      scope,
    ),
    commandFromPlan(
      projectId,
      "vercel",
      "CREATE_PROJECT",
      {
        projectName: repo,
        repository,
        blueprintId: template.blueprintId,
      },
      scope,
    ),
  ];

  for (const command of commands) {
    const result = await executeCommand(access, command, resolver);
    if (!result.ok) return stopWithResult(access, result);
  }

  const deploy = commandFromPlan(
    projectId,
    "vercel",
    "DEPLOY",
    {
      projectName: repo,
      repository,
      repoId: repositoryResult.resourceId ?? "",
    },
    scope,
  );
  const deploymentResult = await executeCommand(
    access,
    deploy,
    resolver,
    false,
  );
  if (!deploymentResult.ok) return stopWithResult(access, deploymentResult);

  await access.supabase
    .from("deployment_sessions")
    .update({
      state: "WAITING_FOR_PROVIDER",
      current_stage: "Vercel이 서비스를 배포하고 있습니다.",
      completed_stages: [
        "PREPARING",
        "GITHUB",
        "SUPABASE",
        "VERCEL_PROJECT",
      ],
      completion_report: {
        state: "WAITING_FOR_PROVIDER",
        productionReady: false,
        deploymentId: deploymentResult.resourceId,
        serviceUrl: deploymentResult.url,
        repositoryUrl: repositoryResult.url,
        outcomes: template.outcomes,
        blueprintId: template.blueprintId,
        capabilities: template.capabilities,
        requiredProviders: template.requiredProviders,
        verificationProfile: template.verification.profile,
        warnings: [],
      } as never,
    })
    .eq("id", deployment.id)
    .eq("user_id", access.user.id);
  await access.supabase
    .from("autonomous_build_sessions")
    .update({
      status: "VERIFYING",
      current_phase: "VERIFICATION",
      completed_phases: [
        "ANALYZING",
        "PREFERENCE",
        "PLANNING",
        "PREPARATION",
        "APPROVAL",
        "PROVISIONING",
      ],
      blocked_reason: null,
      next_user_action: null,
    })
    .eq("id", sessionId)
    .eq("user_id", access.user.id);
  return {
    ok: true as const,
    status: "VERIFYING" as const,
    serviceUrl: deploymentResult.url,
  };
}

function verifiedRun(
  projectId: string,
  providers: string[],
  now: Date,
  verificationProfile: GeneratedApplication["verification"]["profile"],
) {
  const base = createVerificationRun(
    projectId,
    providers.map((providerId) => ({ providerId, required: true })),
  );
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const targets: VerificationTarget[] = base.targets.map((target) => ({
    ...target,
    status: "VERIFIED",
    stage: target.providerId === "vercel" ? "END_TO_END" : "RESOURCE_EXISTENCE",
    expiresAt,
  }));
  const attempts: VerificationAttempt[] = targets.map((target, index) => ({
    id: `${target.id}-${now.getTime()}-${index}`,
    targetId: target.id,
    status: "VERIFIED",
    startedAt: now.toISOString(),
    finishedAt: now.toISOString(),
    evidence: {
      providerId: target.providerId,
      checkedAt: now.toISOString(),
      capabilities:
        target.providerId === "vercel"
          ? verificationProfile === "GENERAL_CRUD"
            ? [
                "deployment_ready",
                "health_check",
                "auth_signup",
                "auth_login",
                "user_scoped_crud",
                "search",
                "status_workflow",
                "admin_read",
                "cross_user_rls",
              ]
            : ["deployment_ready", "health_check", "functional_test"]
          : target.providerId === "supabase"
            ? ["resource_exists", "provider_connection", "schema", "rls"]
            : ["resource_exists", "provider_connection"],
      expired: false,
    },
  }));
  const result = calculateFinalVerificationResult(targets);
  return {
    ...base,
    status: verificationRunStatus(targets, result),
    targets,
    attempts,
    result,
    lastRunAt: now.toISOString(),
  };
}

export async function continueAutonomousProvisioning(
  projectId: string,
  sessionId: string,
  trustedUserId?: string,
) {
  const access = await ownedContext(projectId, sessionId, trustedUserId);
  if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
  if (access.session.status === "RECOVERING") {
    await access.supabase
      .from("autonomous_build_sessions")
      .update({ status: "PROVISIONING" })
      .eq("id", sessionId)
      .eq("user_id", access.user.id);
    return runAutonomousProvisioning(projectId, sessionId, trustedUserId);
  }
  if (access.session.status !== "VERIFYING") {
    return { ok: true as const, status: access.session.status };
  }
  const { data: deployment } = await access.supabase
    .from("deployment_sessions")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", access.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!deployment) return { ok: false as const, error: "DEPLOYMENT_NOT_FOUND" };
  const report = (deployment.completion_report ?? {}) as Record<string, unknown>;
  const deploymentId = String(report.deploymentId ?? "");
  const projectName = serviceSlug(access.project.title, projectId);
  let blueprint: GeneratedApplication;
  try {
    const projectConstraints = (access.project.goal_constraints ??
      {}) as Record<string, unknown>;
    const requirementSnapshot = (projectConstraints.requirement_snapshot ??
      {}) as Record<string, unknown>;
    blueprint = generateApplicationBlueprint({
      projectId,
      title: access.project.title,
      goal:
        access.project.goal_description ??
        access.project.goal ??
        access.project.title,
      requestedCapabilities: Array.isArray(
        requirementSnapshot.applicationCapabilities,
      )
        ? (requirementSnapshot.applicationCapabilities as GeneratedApplication["capabilities"])
        : undefined,
    });
  } catch (error) {
    return stopWithResult(access, {
      ok: false,
      status: "FAILED",
      safeCode:
        error instanceof BlueprintSelectionError
          ? error.code
          : "BLUEPRINT_GENERATION_FAILED",
      retryable: false,
    });
  }
  if (!deploymentId) {
    return { ok: false as const, error: "DEPLOYMENT_EVIDENCE_MISSING" };
  }
  if (deployment.retry_count >= maxDeploymentChecks) {
    await access.supabase
      .from("autonomous_build_sessions")
      .update({
        status: "FAILED",
        blocked_reason: "DEPLOYMENT_TIMEOUT",
      })
      .eq("id", sessionId)
      .eq("user_id", access.user.id);
    await access.supabase
      .from("deployment_sessions")
      .update({ state: "FAILED", current_stage: "배포 확인 시간이 초과되었습니다." })
      .eq("id", deployment.id)
      .eq("user_id", access.user.id);
    return { ok: false as const, status: "FAILED", error: "DEPLOYMENT_TIMEOUT" };
  }

  const cache = new Map<string, Record<string, string> | null>();
  const resolver: ProviderCredentialResolver = {
    referenceId: `project-${projectId}`,
    resolve: async (provider = "vercel") => {
      if (!cache.has(provider)) {
        cache.set(
          provider,
          await resolveProviderCredential(projectId, access.user.id, provider),
        );
      }
      return cache.get(provider) ?? null;
    },
  };
  const check = commandFromPlan(
    projectId,
    "vercel",
    "CHECK_DEPLOYMENT_STATUS",
    {
      projectName,
      deploymentId,
      verificationProfile: blueprint.verification.profile,
      blueprintId: blueprint.blueprintId,
    },
    String(
      (access.session.approval_plan as { scopeVersion?: string }).scopeVersion ??
        "",
    ),
  );
  const result = await executeCommand(access, check, resolver, true);
  if (!result.ok && result.safeCode === "VERCEL_DEPLOYMENT_PENDING") {
    await access.supabase
      .from("deployment_sessions")
      .update({
        state: "WAITING_FOR_PROVIDER",
        current_stage: "Vercel 배포 완료를 기다리고 있습니다.",
        retry_count: deployment.retry_count + 1,
      })
      .eq("id", deployment.id)
      .eq("user_id", access.user.id);
    return { ok: true as const, status: "VERIFYING" as const };
  }
  if (!result.ok) return stopWithResult(access, result);

  const now = new Date();
  const verification = verifiedRun(
    projectId,
    blueprint.requiredProviders,
    now,
    blueprint.verification.profile,
  );
  const versions = await access.supabase
    .from("provider_credentials")
    .select("provider,credential_version")
    .eq("project_id", projectId)
    .eq("user_id", access.user.id);
  const credentialVersion = (versions.data ?? [])
    .map((item) => `${item.provider}:${item.credential_version}`)
    .sort()
    .join("|");
  const persisted = await persistVerificationRun(
    projectId,
    verification,
    access.session.execution_id ?? undefined,
    credentialVersion,
    trustedUserId,
  );
  if (!persisted.ok) {
    return {
      ok: false as const,
      status: "FAILED",
      error: persisted.error,
    };
  }
  await access.supabase
    .from("provider_credentials")
    .update({
      status: "VALID",
      last_validated_at: now.toISOString(),
    })
    .eq("project_id", projectId)
    .eq("user_id", access.user.id)
    .in("provider", blueprint.requiredProviders);

  const estimate = deployment.estimate as Parameters<typeof completionReport>[1];
  const completed = completionReport("READY", estimate, {
    serviceUrl: result.url ?? String(report.serviceUrl ?? ""),
    healthCheckPassed: true,
    requiredVerificationPassed: true,
    requiredFunctionTestsPassed: true,
    backupStatus: "UNKNOWN",
    monitoringStatus: "UNKNOWN",
    warnings: [
      "백업과 장기 모니터링 상태는 별도 운영 확인이 필요합니다.",
    ],
    nextRecommendations: [
      "서비스 주소에서 실제 사용자 흐름을 확인하세요.",
      "운영 전 백업과 모니터링 정책을 확인하세요.",
    ],
  });
  await access.supabase
    .from("deployment_sessions")
    .update({
      state: "READY",
      current_stage: "서비스 자동 구축과 검증이 완료되었습니다.",
      completed_stages: [
        "PREPARING",
        "GITHUB",
        "SUPABASE",
        "VERCEL_PROJECT",
        "DEPLOYMENT",
        "HEALTH_CHECK",
        "FUNCTIONAL_TEST",
        "VERIFICATION",
      ],
      completion_report: {
        ...completed,
        repositoryUrl: report.repositoryUrl,
        outcomes: report.outcomes,
      } as never,
    })
    .eq("id", deployment.id)
    .eq("user_id", access.user.id);
  const { data: commandRuns } = await access.supabase
    .from("provider_command_runs")
    .select("status,attempt_number")
    .eq("project_id", projectId)
    .eq("autonomous_session_id", sessionId);
  const successfulCommands = (commandRuns ?? []).filter(
    (command) => command.status === "SUCCEEDED",
  ).length;
  const attempts = (commandRuns ?? []).reduce(
    (sum, command) => sum + command.attempt_number,
    0,
  );
  const metrics = finalizeFatigueMetrics(
    access.session.metrics as unknown as FatigueMetrics,
    {
      automaticSteps: successfulCommands,
      attempts,
      startedAt: access.session.created_at,
      userReadyAt:
        access.session.approval_granted_at ??
        access.session.consent_granted_at ??
        undefined,
      finishedAt: now.toISOString(),
    },
  );
  await access.supabase
    .from("autonomous_build_sessions")
    .update({
      status: completed.warnings.length ? "READY_WITH_WARNINGS" : "READY",
      completed_phases: [
        "ANALYZING",
        "PREFERENCE",
        "PLANNING",
        "PREPARATION",
        "APPROVAL",
        "PROVISIONING",
        "VERIFICATION",
      ],
      blocked_reason: null,
      next_user_action: null,
      metrics: metrics as never,
    })
    .eq("id", sessionId)
    .eq("user_id", access.user.id);
  if (access.session.execution_id) {
    await access.supabase
      .from("build_executions")
      .update({ status: "SUCCEEDED" })
      .eq("id", access.session.execution_id)
      .eq("user_id", access.user.id);
    await access.supabase
      .from("execution_tasks")
      .update({ status: "SUCCEEDED" })
      .eq("execution_id", access.session.execution_id)
      .eq("action", "AUTO");
  }
  await access.supabase
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId)
    .eq("user_id", access.user.id);
  return {
    ok: true as const,
    status: completed.warnings.length
      ? ("READY_WITH_WARNINGS" as const)
      : ("READY" as const),
    serviceUrl: completed.serviceUrl,
    productionReady: completed.productionReady,
  };
}
