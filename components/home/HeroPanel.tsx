"use client";

import { Compass, Crown, UsersRound } from "lucide-react";
import { OptionsPreview } from "./OptionsPreview";
import { StartButton } from "./StartButton";

export default function HeroPanel() {
  const handleStartSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <section className="relative w-full max-w-5xl">
      <div className="greek-column left-column" aria-hidden />
      <div className="greek-column right-column" aria-hidden />

      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(210_168_87_/_0.48)] bg-[rgb(19_47_77_/_0.72)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(227_193_114_/_0.94)]">
          <Compass className="h-3.5 w-3.5" />
          Civilization VI
        </div>

        <form
          className="mt-6 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center"
          onSubmit={handleStartSubmit}
        >
          <label htmlFor="player-nickname" className="sr-only">
            Nickname do jogador
          </label>
          <input
            id="player-nickname"
            name="playerNickname"
            type="text"
            required
            minLength={2}
            maxLength={20}
            placeholder="Digite seu nickname"
            className="game-text-input h-14 w-full px-4 text-base font-semibold sm:w-72"
          />
          <StartButton />
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)]">
            <UsersRound className="h-3.5 w-3.5 shrink-0" />
            <span>2 a 12 jogadores</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)]">
            <Crown className="h-3.5 w-3.5 shrink-0" />
            <span>Modo padrão</span>
          </div>
        </div>

        <OptionsPreview />
      </div>
    </section>
  );
}
