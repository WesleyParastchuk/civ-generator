"use client";

import { useEffect, useState } from "react";

type Props = {
  currentTurn: number;
  totalTurns: number;
  pointsPerTurn: number;
  pointsSpent: number;
  deadline: number; // UTC ms; 0 = not active
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

export function TurnHeader({ currentTurn, totalTurns, pointsPerTurn, pointsSpent, deadline }: Props) {
  const remaining = pointsPerTurn - pointsSpent;
  const pct = Math.max(0, (remaining / pointsPerTurn) * 100);

  const [timeLeftMs, setTimeLeftMs] = useState(() =>
    deadline > 0 ? Math.max(0, deadline - Date.now()) : 0,
  );

  useEffect(() => {
    if (deadline <= 0) {
      setTimeLeftMs(0);
      return;
    }
    const update = () => setTimeLeftMs(Math.max(0, deadline - Date.now()));
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [deadline]);

  const timePct = deadline > 0 ? timeLeftMs / ((deadline - Date.now() + timeLeftMs) || 1) : 1;
  const timeColor =
    timeLeftMs === 0
      ? "text-[rgb(206_189_156_/_0.4)]"
      : timePct < 0.2
        ? "text-[rgb(220_80_70_/_0.95)]"
        : timePct < 0.5
          ? "text-[rgb(220_170_60_/_0.95)]"
          : "text-[rgb(239_223_187_/_0.95)]";

  return (
    <div className="rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-cinzel)] text-sm font-semibold tracking-wide text-[rgb(214_178_97_/_0.9)]">
          Turno {currentTurn} / {totalTurns}
        </span>
        <div className="flex items-center gap-3">
          {deadline > 0 && (
            <span className={`font-mono text-base font-bold tabular-nums ${timeColor}`}>
              {formatCountdown(timeLeftMs)}
            </span>
          )}
          <span className="text-sm text-[rgb(206_189_156_/_0.8)]">
            <span className="font-bold text-[rgb(239_223_187_/_0.95)]">{remaining}</span>
            {" "}pts
          </span>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgb(255_255_255_/_0.08)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgb(180_138_56)] to-[rgb(234_200_124)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
