import Link from "next/link";
import HeroPanel from "@/components/home/HeroPanel";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-x-clip">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />

      <nav className="flex justify-end px-6 pt-4">
        <Link
          href="/civilizacoes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.36)] bg-[rgb(11_25_44_/_0.6)] px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.85)] hover:border-[rgb(220_183_101_/_0.6)] hover:text-[rgb(240_210_140_/_0.95)] transition-colors"
        >
          Civilizações
        </Link>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-7 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
        <HeroPanel />
      </main>
    </div>
  );
}
