import { describe, expect, it, vi } from "vitest";
import {
  buildBf0ProjectDraftPayload,
  persistBf0ProjectDraft,
  type Bf0ProjectDraftInput,
} from "./draft-persistence";

const valid: Bf0ProjectDraftInput = {
  idea: "고객 문의를 분류해 담당자에게 전달하는 흐름을 만들고 싶어요",
  goal: "분류하고 담당자에게 전달",
  source: "웹 폼",
  approval: "중요 작업만 승인",
  output: "Slack",
};

describe("BF0 Project draft persistence", () => {
  it("derives the Requirement Snapshot on the server and stores only safe draft choices", () => {
    const result = buildBf0ProjectDraftPayload(valid);
    expect(result.status).toBe("VALID");
    if (result.status !== "VALID") return;
    expect(result.value.goalConstraints).toMatchObject({
      source: "BF0_PRODUCT_EXPERIENCE",
      bf0_design_draft: { goal: valid.goal, source: valid.source, approval: valid.approval, output: valid.output },
    });
    expect(result.value.goalConstraints).toHaveProperty("requirement_snapshot");
  });

  it("rejects incomplete and secret-shaped drafts before authentication or insert", async () => {
    const userId = vi.fn(async () => "user.1");
    const insert = vi.fn(async () => "project.1");
    const revalidate = vi.fn();
    await expect(persistBf0ProjectDraft({ ...valid, output: null }, { userId, insert, revalidate }))
      .resolves.toEqual({ ok: false, errorCode: "DRAFT_INVALID" });
    await expect(persistBf0ProjectDraft({ ...valid, idea: `sk-${"x".repeat(24)}` }, { userId, insert, revalidate }))
      .resolves.toEqual({ ok: false, errorCode: "DRAFT_UNSAFE" });
    expect(userId).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("requires an authenticated user before creating a Project", async () => {
    const insert = vi.fn(async () => "project.1");
    await expect(persistBf0ProjectDraft(valid, { userId: async () => null, insert, revalidate: vi.fn() }))
      .resolves.toEqual({ ok: false, errorCode: "UNAUTHENTICATED" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("normalizes an authentication lookup exception to a safe persistence failure", async () => {
    const insert = vi.fn(async () => "project.1");
    await expect(persistBf0ProjectDraft(valid, {
      userId: async () => { throw new Error("auth unavailable"); },
      insert,
      revalidate: vi.fn(),
    })).resolves.toEqual({ ok: false, errorCode: "PERSISTENCE_FAILED" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns a safe persistence failure without redirecting on an insert error", async () => {
    const revalidate = vi.fn();
    await expect(persistBf0ProjectDraft(valid, {
      userId: async () => "user.1",
      insert: async () => { throw new Error("database unavailable"); },
      revalidate,
    })).resolves.toEqual({ ok: false, errorCode: "PERSISTENCE_FAILED" });
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("revalidates only after the owned Project is created", async () => {
    const revalidate = vi.fn();
    const result = await persistBf0ProjectDraft(valid, {
      userId: async () => "user.1",
      insert: async (payload) => {
        expect(payload.userId).toBe("user.1");
        return "project.1";
      },
      revalidate,
    });
    expect(result).toEqual({ ok: true, projectId: "project.1" });
    expect(revalidate).toHaveBeenCalledWith("project.1");
  });
});
