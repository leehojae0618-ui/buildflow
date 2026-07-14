import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("유효한 이메일을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const signupSchema = z.object({
  email: z.string().trim().email("유효한 이메일을 입력해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요."),
  termsAccepted: z.literal("on", { message: "약관 동의가 필요합니다." }),
}).refine((data) => data.password === data.passwordConfirm, {
  path: ["passwordConfirm"], message: "비밀번호가 일치하지 않습니다.",
});

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function toFieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export function getSafeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
}
