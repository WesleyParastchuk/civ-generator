"use client";

import { useEffect, useState } from "react";

type Props = {
  nextTurn: number;
  totalTurns: number;
  betweenDeadline: number; // UTC ms when next turn starts (server-driven)
};

export function BetweenTurnsOverlay({ nextTurn, totalTurns, betweenDeadline }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((betweenDeadline - Date.now()) / 1000)),
  );

  useEffect(() => {
    const update = () =>
      setSecondsLeft(Math.max(0, Math.ceil((betweenDeadline - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [betweenDeadline]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(2_7_15_/_0.85)] backdrop-blur-sm">
      <div className="imperial-border mx-4 w-full max-w-sm rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.97)] p-8 text-center shadow-[0_24px_60px_rgb(2_7_15_/_0.7)]">
        <p className="font-[var(--font-cinzel)] text-xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
          Fim do turno
        </p>
        <p className="mt-3 text-[rgb(206_189_156_/_0.7)]">
          Os votos foram registrados. Preparando turno{" "}
          <span className="font-semibold text-[rgb(239_223_187_/_0.9)]">{nextTurn}</span>{" "}
          de {totalTurns}.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <span className="font-mono text-5xl font-bold tabular-nums text-[rgb(214_178_97_/_0.95)]">
            {secondsLeft}
          </span>
        </div>
      </div>
    </div>
  );
}
