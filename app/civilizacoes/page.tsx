import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import { ArrowLeft, Pencil } from "lucide-react";

interface CivGuide {
  leaderId: number;
  leader: string;
  civilization: string;
  habilidadeCiv: string;
  habilidadeLider: string;
  unidadeUnica: string;
  infraUnica: string;
  playstyle: string;
  vitoriaIdeal: string;
}

function loadGuides(): CivGuide[] {
  const raw = readFileSync(join(process.cwd(), "lib", "civ-guides.json"), "utf-8");
  return JSON.parse(raw).guides;
}

const VICTORY_STYLES: Record<string, { bg: string; text: string }> = {
  "Cultural":    { bg: "rgb(139 92 246 / 0.22)",  text: "rgb(196 168 255 / 0.95)" },
  "Científica":  { bg: "rgb(59 130 246 / 0.22)",  text: "rgb(147 196 255 / 0.95)" },
  "Dominação":   { bg: "rgb(239 68 68 / 0.22)",   text: "rgb(255 160 160 / 0.95)" },
  "Religiosa":   { bg: "rgb(234 179 8 / 0.22)",   text: "rgb(253 224 71 / 0.95)"  },
  "Diplomática": { bg: "rgb(16 185 129 / 0.22)",  text: "rgb(110 231 183 / 0.95)" },
};

export default function CivilizacoesPage() {
  const guides = loadGuides();
  const withContent = guides.filter((g) => g.habilidadeCiv || g.playstyle);
  const empty = guides.filter((g) => !g.habilidadeCiv && !g.playstyle);

  return (
    <div className="relative isolate min-h-[100dvh]">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[rgb(216_183_108_/_0.7)] hover:text-[rgb(240_210_140_/_0.9)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Início
            </Link>
            <h1
              className="text-2xl font-semibold tracking-wide text-[rgb(240_215_150_/_0.95)]"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              Civilizações
            </h1>
          </div>
          <Link
            href="/civilizacoes/editar"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)] hover:border-[rgb(220_183_101_/_0.65)] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar guias
          </Link>
        </div>

        {withContent.length === 0 && (
          <div className="rounded-xl border border-[rgb(212_171_86_/_0.2)] bg-[rgb(11_26_46_/_0.7)] px-6 py-10 text-center">
            <p className="text-[rgb(200_175_120_/_0.7)] text-sm">
              Nenhum guia preenchido ainda.{" "}
              <Link href="/civilizacoes/editar" className="underline text-[rgb(216_183_108_/_0.9)]">
                Clique em Editar guias
              </Link>{" "}
              para começar.
            </p>
          </div>
        )}

        {withContent.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {withContent.map((guide) => {
              const vstyle = VICTORY_STYLES[guide.vitoriaIdeal];
              return (
                <div
                  key={guide.leaderId}
                  className="game-card rounded-xl border border-[rgb(212_171_86_/_0.28)] bg-[rgb(11_26_46_/_0.82)] p-4"
                >
                  <div className="mb-3">
                    <p
                      className="text-base font-semibold text-[rgb(240_215_150_/_0.95)] leading-tight"
                      style={{ fontFamily: "var(--font-cinzel)" }}
                    >
                      {guide.civilization}
                    </p>
                    <p className="text-xs text-[rgb(200_175_120_/_0.7)] mt-0.5">{guide.leader}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {guide.vitoriaIdeal && vstyle && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em]"
                        style={{ background: vstyle.bg, color: vstyle.text }}
                      >
                        {guide.vitoriaIdeal}
                      </span>
                    )}
                    {guide.playstyle && (
                      <span className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] bg-[rgb(255_255_255_/_0.06)] text-[rgb(200_180_140_/_0.8)]">
                        {guide.playstyle}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-[rgb(220_200_165_/_0.85)] leading-relaxed">
                    {guide.habilidadeCiv && (
                      <div>
                        <span className="font-semibold text-[rgb(216_183_108_/_0.75)] uppercase tracking-[0.08em] text-[0.62rem]">Civ </span>
                        {guide.habilidadeCiv}
                      </div>
                    )}
                    {guide.habilidadeLider && (
                      <div>
                        <span className="font-semibold text-[rgb(216_183_108_/_0.75)] uppercase tracking-[0.08em] text-[0.62rem]">Líder </span>
                        {guide.habilidadeLider}
                      </div>
                    )}
                    {guide.unidadeUnica && (
                      <div>
                        <span className="font-semibold text-[rgb(216_183_108_/_0.75)] uppercase tracking-[0.08em] text-[0.62rem]">Unidade </span>
                        {guide.unidadeUnica}
                      </div>
                    )}
                    {guide.infraUnica && (
                      <div>
                        <span className="font-semibold text-[rgb(216_183_108_/_0.75)] uppercase tracking-[0.08em] text-[0.62rem]">Infra </span>
                        {guide.infraUnica}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {empty.length > 0 && withContent.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(200_175_120_/_0.45)]">
              Sem guia ({empty.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {empty.map((g) => (
                <span
                  key={g.leaderId}
                  className="rounded-lg border border-[rgb(212_171_86_/_0.15)] bg-[rgb(11_26_46_/_0.5)] px-3 py-1.5 text-xs text-[rgb(200_175_120_/_0.5)]"
                >
                  {g.civilization} · {g.leader}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
