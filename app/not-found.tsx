import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-x-clip">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-7">
        <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-10 text-center shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur">
          <p className="font-[var(--font-cinzel)] text-5xl font-semibold text-[rgb(214_178_97_/_0.9)]">404</p>
          <p className="mt-4 font-[var(--font-cinzel)] text-xl text-[rgb(239_223_187_/_0.9)]">
            Sala não encontrada
          </p>
          <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.7)]">
            Esta sala não existe ou já foi encerrada.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-[rgb(214_178_97_/_0.9)] underline underline-offset-4 hover:text-[rgb(239_223_187_/_0.95)]"
          >
            Criar nova sala
          </Link>
        </div>
      </main>
    </div>
  );
}
