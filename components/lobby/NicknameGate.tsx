"use client";

import { Compass } from "lucide-react";
import { StartButton } from "@/components/home/StartButton";

type Props = {
  onSubmit: (nickname: string) => void;
};

export function NicknameGate({ onSubmit }: Props) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nickname = (formData.get("nickname") as string).trim();
    if (nickname) onSubmit(nickname);
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

        <h1 className="mt-6 font-[var(--font-cinzel)] text-2xl tracking-wide text-[rgb(239_223_187_/_0.98)]">
          Entrar na sala
        </h1>
        <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.84)]">
          Digite seu nickname para se juntar à partida.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center"
        >
          <label htmlFor="nickname" className="sr-only">
            Nickname
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            minLength={2}
            maxLength={20}
            placeholder="Digite seu nickname"
            className="game-text-input h-14 w-full px-4 text-base font-semibold sm:w-72"
            autoFocus
          />
          <StartButton />
        </form>
      </div>
    </section>
  );
}
