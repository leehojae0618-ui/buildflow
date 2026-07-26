import { loadEnvConfig } from "@next/env";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const runLiveSmoke = process.env.BUILDFLOW_OPENAI_SMOKE === "1";

function writeSafeDiagnostic(result: {
  status: string;
  errorCode?: string;
  resultStatus?: string;
  evidence: {
    count: number;
    model?: string;
    latencyMs?: number;
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
    errorCode?: string;
  };
}) {
  const diagnostic = {
    status: result.status,
    errorCode: result.errorCode ?? null,
    resultStatus: result.resultStatus ?? null,
    evidence: {
      count: result.evidence.count,
      model: result.evidence.model ?? null,
      latencyMs: result.evidence.latencyMs ?? null,
      usage: result.evidence.usage ?? null,
      errorCode: result.evidence.errorCode ?? null,
    },
  };
  const serialized = JSON.stringify(diagnostic);
  if (/(?:sk-[A-Za-z0-9_-]{8,}|bearer\s+[A-Za-z0-9._-]+|"(?:systemInstruction|userInput|prompt|outputReference|outputChecksum)")/i.test(serialized)) {
    throw new Error("OpenAI smoke diagnostic contained an unsafe value.");
  }
  process.stdout.write(`RUNTIME_SMOKE_RESULT ${serialized}\n`);
}

describe("OpenAI Runtime live smoke", () => {
  const smoke = runLiveSmoke ? it : it.skip;

  smoke("executes one real non-streaming Runtime request and returns safe metadata", async () => {
    loadEnvConfig(process.cwd(), true);
    const { hasOpenAIEnv } = await import("../../lib/env/server");
    if (!hasOpenAIEnv) {
      throw new Error("OpenAI smoke configuration is missing; no provider request was made.");
    }

    const { runOpenAIRuntimeSmokeTest } = await import("./runtime-smoke");
    const result = await runOpenAIRuntimeSmokeTest();
    writeSafeDiagnostic(result);

    expect(result.status, `OpenAI Runtime smoke failed: ${result.errorCode ?? "RUNTIME_SMOKE_UNKNOWN_FAILURE"}`).toBe("SUCCEEDED");
    expect(result.resultStatus).toBe("SUCCEEDED");
    expect(result.eventTypes).toEqual([
      "PLAN_ACCEPTED",
      "RUNTIME_STARTED",
      "PROVIDER_INVOCATION_STARTED",
      "PROVIDER_INVOCATION_COMPLETED",
      "EVIDENCE_APPENDED",
      "STEP_COMPLETED",
      "RUNTIME_COMPLETED",
    ]);
    expect(result.evidence).toMatchObject({
      count: 1,
      status: "SUCCEEDED",
      provider: "openai",
      hasSafeInputChecksum: true,
      hasSafeOutputChecksum: true,
      hasProviderRequestReference: true,
    });
    expect(JSON.stringify(result)).not.toMatch(/"(?:systemInstruction|userInput|prompt|outputReference|outputChecksum)"/i);
  }, 30_000);
});
