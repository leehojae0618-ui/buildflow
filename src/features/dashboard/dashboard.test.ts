import { describe, expect, it } from "vitest";
import { relativeDate, statusLabel, truncate } from "./format";

describe("dashboard format", () => { it("truncates long goals", () => expect(truncate("a".repeat(121), 100)).toHaveLength(101)); it("maps statuses", () => expect(statusLabel.in_progress).toBe("진행 중")); it("formats relative dates", () => expect(relativeDate("2026-07-15T11:00:00Z")).toBe("1시간 전")); });
