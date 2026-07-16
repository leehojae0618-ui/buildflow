import { describe, expect, it } from "vitest";
import ts from "typescript";
import {
  BlueprintSelectionError,
  generateApplicationBlueprint,
  inferApplicationCapabilities,
  selectApplicationBlueprint,
} from "./blueprints";

describe("application blueprints", () => {
  it("maps a Task Manager goal to the complete General CRUD capability set", () => {
    const input = {
      title: "Team Task Manager",
      goal: "회원가입, 로그인, 사용자별 Todo CRUD, 검색, 상태 변경, 관리자 조회가 가능한 반응형 웹앱",
    };
    expect(inferApplicationCapabilities(input)).toEqual([
      "AUTH",
      "USER_SCOPED_CRUD",
      "SEARCH",
      "STATUS_WORKFLOW",
      "ADMIN_READ",
      "RESPONSIVE_UI",
    ]);
    expect(selectApplicationBlueprint(input)).toMatchObject({
      id: "general-crud-v1",
      requiredProviders: ["github", "supabase", "vercel"],
      verification: {
        profile: "GENERAL_CRUD",
        expectedTables: ["buildflow_todos", "buildflow_admins"],
      },
    });
  });

  it("keeps the AI inquiry blueprint separate", () => {
    expect(
      selectApplicationBlueprint({
        title: "AI 문의 서비스",
        goal: "고객 문의를 분류하고 AI 답변 초안을 작성해 주세요.",
      }),
    ).toMatchObject({
      id: "ai-inquiry-v1",
      requiredProviders: ["github", "supabase", "vercel", "openai"],
    });
  });

  it("blocks unsupported and ambiguous matching instead of selecting a wrong blueprint", () => {
    expect(() =>
      selectApplicationBlueprint({
        title: "Analytics",
        goal: "회사의 모든 데이터를 분석하는 범용 플랫폼",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<BlueprintSelectionError>>({
        code: "BLUEPRINT_NOT_SUPPORTED",
      }),
    );
    expect(() =>
      selectApplicationBlueprint({
        title: "Support Task Manager",
        goal: "고객 문의 답변과 Todo CRUD를 한 앱에서 제공",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<BlueprintSelectionError>>({
        code: "BLUEPRINT_AMBIGUOUS",
      }),
    );
  });

  it("generates deterministic CRUD artifacts, schema, RLS, and responsive UI", () => {
    const input = {
      projectId: "87654321-1234-1234-1234-123456789012",
      title: "Task Manager",
      goal: "회원가입과 사용자별 Todo CRUD, 검색, 상태 관리, 관리자 조회",
    };
    const first = generateApplicationBlueprint(input);
    const second = generateApplicationBlueprint(input);
    expect(first.blueprintId).toBe("general-crud-v1");
    expect(first.checksum).toBe(second.checksum);
    expect(first.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "app/page.tsx",
        "app/admin/page.tsx",
        "app/api/health/route.ts",
        "lib/supabase.ts",
      ]),
    );
    expect(first.sql).toContain("public.buildflow_todos");
    expect(first.sql).toContain("public.buildflow_admins");
    expect(first.sql).toContain("enable row level security");
    expect(first.sql).toContain("(select auth.uid()) = user_id");
    expect(first.sql).not.toMatch(/\b(drop\s+(table|schema|database))\b/i);
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("sk-test-secret-value");
    expect(serialized).not.toContain("service-role-secret-value");
    expect(serialized).not.toContain("server-key-secret-value");

    for (const file of first.files.filter((item) =>
      /\.(ts|tsx)$/.test(item.path),
    )) {
      const result = ts.transpileModule(file.content, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: file.path,
        reportDiagnostics: true,
      });
      expect(result.diagnostics ?? []).toEqual([]);
    }
  });
});
