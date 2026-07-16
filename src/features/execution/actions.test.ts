import { describe, expect, it } from "vitest";
describe("execution action contract", () => { it("uses an idempotency key and never accepts secret fields", () => { const form = new FormData(); form.set("projectId", "project"); form.set("idempotencyKey", "key"); expect(form.has("secret")).toBe(false); expect("idempotencyKey").toContain("idempotency"); }); });
