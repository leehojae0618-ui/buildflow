export function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "이메일 또는 비밀번호를 확인해주세요.";
  if (normalized.includes("user already registered")) return "이미 가입된 이메일입니다.";
  if (normalized.includes("email not confirmed")) return "이메일 인증을 완료해주세요.";
  if (normalized.includes("signup") && normalized.includes("disabled")) return "현재 회원가입을 사용할 수 없습니다.";
  if (normalized.includes("too many requests")) return "잠시 후 다시 시도해주세요.";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}
