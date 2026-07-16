import { describe, expect, it } from "vitest";
import ts from "typescript";
import { generateServiceTemplate, serviceSlug } from "./service-template";

describe("generated AI service", () => {
  it("creates a deterministic runnable service without secret values", () => {
    const first = generateServiceTemplate({
      projectId: "12345678-1234-1234-1234-123456789012",
      title: "AI 고객센터",
      goal: "문의 내용을 분류하고 답변 초안을 만들어줘.",
    });
    const second = generateServiceTemplate({
      projectId: "12345678-1234-1234-1234-123456789012",
      title: "AI 고객센터",
      goal: "문의 내용을 분류하고 답변 초안을 만들어줘.",
    });
    expect(first.checksum).toBe(second.checksum);
    expect(first.files.map((file) => file.path)).toContain(
      "app/api/health/route.ts",
    );
    expect(JSON.stringify(first)).not.toContain("sk-test-secret");
    expect(first.sql).toContain("enable row level security");
    expect(first.sql).toContain("using (false)");
    expect(first.sql).not.toMatch(/\b(drop|truncate)\b/i);

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

  it("builds a stable provider-safe slug", () => {
    expect(
      serviceSlug(
        "Customer Support",
        "12345678-1234-1234-1234-123456789012",
      ),
    ).toBe("customer-support-12345678");
    expect(
      serviceSlug(
        "LIVE-EVIDENCE AI 문의 서비스",
        "d10bcbd6-b588-4c36-87ee-7881538e0218",
      ),
    ).toBe("live-evidence-ai-d10bcbd6");
  });
});
