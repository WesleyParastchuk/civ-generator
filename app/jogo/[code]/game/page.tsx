export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-x-clip">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-7 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
        <section className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 text-center shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
          <h1 className="font-[var(--font-cinzel)] text-3xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
            Jogo iniciado!
          </h1>
          <p className="mt-4 text-[rgb(206_189_156_/_0.7)]">
            Sala:{" "}
            <span className="font-mono font-semibold text-[rgb(227_200_140_/_0.92)]">
              {code}
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
