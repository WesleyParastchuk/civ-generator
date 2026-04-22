"use client";

type Props = {
  currentTurn: number;
  totalTurns: number;
  pointsPerTurn: number;
  pointsSpent: number;
};

export function TurnHeader({ currentTurn, totalTurns, pointsPerTurn, pointsSpent }: Props) {
  const remaining = pointsPerTurn - pointsSpent;
  const pct = Math.max(0, (remaining / pointsPerTurn) * 100);

  return (
    <div className="rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-cinzel)] text-sm font-semibold tracking-wide text-[rgb(214_178_97_/_0.9)]">
          Turno {currentTurn} / {totalTurns}
        </span>
        <span className="text-sm text-[rgb(206_189_156_/_0.8)]">
          <span className="font-bold text-[rgb(239_223_187_/_0.95)]">{remaining}</span>
          {" "}pts restantes
        </span>
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
