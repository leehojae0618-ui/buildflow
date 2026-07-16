"use client";

import { useEffect, useState } from "react";
import {
  getProviderCredentialStatuses,
  storeProviderCredential,
} from "../actions";
import type { ProvisioningCredentialProvider } from "../provider-payload";

const providers: Array<{
  id: ProvisioningCredentialProvider;
  title: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    secret: boolean;
    required?: boolean;
  }>;
}> = [
  {
    id: "github",
    title: "서비스 코드 저장",
    description: "Private Repository 생성과 파일 반영에 사용합니다.",
    fields: [
      { name: "token", label: "GitHub Access Token", secret: true },
      { name: "owner", label: "Owner 또는 Organization (선택)", secret: false, required: false },
    ],
  },
  {
    id: "supabase",
    title: "데이터와 로그인 환경",
    description: "기존 테스트 Project에 안전한 Schema를 적용합니다.",
    fields: [
      { name: "accessToken", label: "Supabase Management Access Token", secret: true },
      { name: "projectRef", label: "Project Ref", secret: false },
      { name: "projectUrl", label: "Project URL", secret: false },
      { name: "anonKey", label: "Publishable / Anon Key", secret: true },
      { name: "serverKey", label: "Server Secret Key", secret: true },
    ],
  },
  {
    id: "vercel",
    title: "서비스 배포",
    description: "Private Repository를 연결하고 Production Deployment를 생성합니다.",
    fields: [
      { name: "token", label: "Vercel Access Token", secret: true },
      { name: "teamId", label: "Team ID (선택)", secret: false, required: false },
    ],
  },
  {
    id: "openai",
    title: "AI 기능",
    description: "배포된 서비스의 AI 응답 기능에 사용합니다.",
    fields: [{ name: "apiKey", label: "OpenAI API Key", secret: true }],
  },
];

export function ProviderCredentialPanel({
  projectId,
  onReady,
}: {
  projectId: string;
  onReady: () => void;
}) {
  const [stored, setStored] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function loadStatuses() {
    const result = await getProviderCredentialStatuses(projectId);
    return result.ok
      ? Object.fromEntries(
          result.references.map((reference) => [
            reference.provider,
            reference.status,
          ]),
        )
      : null;
  }

  useEffect(() => {
    let active = true;
    void getProviderCredentialStatuses(projectId).then((result) => {
      if (!active || !result.ok) return;
      setStored(
        Object.fromEntries(
          result.references.map((reference) => [
            reference.provider,
            reference.status,
          ]),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  async function save(formData: FormData, form: HTMLFormElement) {
    const result = await storeProviderCredential(formData);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    form.reset();
    setMessage(`${result.provider} 연결 정보를 안전하게 저장했습니다.`);
    const statuses = await loadStatuses();
    if (statuses) setStored(statuses);
  }

  const ready = providers.every((provider) =>
    ["PROVIDED", "VALID"].includes(stored[provider.id] ?? ""),
  );

  return (
    <div className="bf-panel bf-warning mt-5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
        연결 준비
      </p>
      <h4 className="mt-2 text-base font-medium text-white">
        AI가 구축에 필요한 계정을 한 번에 확인합니다
      </h4>
      <p className="mt-2 text-sm text-zinc-300">
        입력값은 암호화 저장되며 AI Prompt, 기술 로그, Snapshot에는 포함되지
        않습니다.
      </p>
      <div className="mt-5 grid gap-4">
        {providers.map((provider) => (
          <form
            key={provider.id}
            onSubmit={(event) => {
              event.preventDefault();
              void save(new FormData(event.currentTarget), event.currentTarget);
            }}
            className="bf-card p-4"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="provider" value={provider.id} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{provider.title}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {provider.description}
                </p>
              </div>
              <span className="text-xs text-zinc-300">
                {stored[provider.id] ?? "입력 필요"}
              </span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {provider.fields.map((field) => (
                <label
                  key={field.name}
                  className="grid gap-1 text-xs text-zinc-400"
                >
                  {field.label}
                  <input
                    name={field.name}
                    type={field.secret ? "password" : "text"}
                    required={field.required !== false}
                    autoComplete="off"
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-300/50"
                  />
                </label>
              ))}
            </div>
            <button type="submit" className="bf-action mt-3 px-3 py-2 text-xs">
              암호화해 저장
            </button>
          </form>
        ))}
      </div>
      <button
        type="button"
        disabled={!ready}
        onClick={onReady}
        className="bf-action mt-5 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        계정 준비를 마치고 자동 구축 계속하기
      </button>
      {message && (
        <p className="mt-3 text-xs text-zinc-300" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
