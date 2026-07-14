const highlights = [
  'AI Workflow Design Platform',
  'Foundation',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090909] text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-2xl border border-zinc-800 bg-zinc-950/70 p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="text-sm font-medium tracking-[0.28em] text-cyan-300">
              BuildFlow
            </div>
            <span className="border border-cyan-400/40 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300">
              Foundation
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              무엇을 만들고 싶나요?
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
              원하는 결과를 입력하면 필요한 AI 도구와 워크플로를 설계합니다.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {highlights.map((item) => (
              <span
                key={item}
                className="border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10">
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-200 opacity-80"
            >
              개발 준비 중
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
