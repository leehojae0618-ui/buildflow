import { findCredentialDefinition } from "../definitions";
import type { CredentialReference } from "../types";

export function CredentialSummary({
  references,
}: {
  references: CredentialReference[];
}) {
  return (
    <section className="mt-5 border border-rose-400/20 bg-rose-400/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-300">
        필요한 계정
      </p>
      <p className="mt-2 text-xs text-zinc-400">
        아래 항목은 설계에서 확인된 연결 요구사항입니다. 실제 입력은 자동 구축
        세션의 암호화 연결 화면에서 한 번에 진행합니다.
      </p>
      <div className="mt-4 grid gap-3">
        {references.map((reference) => {
          const definition = findCredentialDefinition(reference.providerId);
          if (!definition) return null;
          return (
            <div
              key={reference.id}
              className="flex items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4"
            >
              <div>
                <h3 className="text-sm font-medium text-zinc-100">
                  {definition.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Secret 값은 Snapshot과 기술 로그에 포함되지 않습니다.
                </p>
              </div>
              <span className="text-xs text-zinc-400">
                {reference.configured ? reference.status : "연결 필요"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
