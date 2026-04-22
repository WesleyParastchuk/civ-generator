"use client";

import { Minus, Plus, Star, Timer } from "lucide-react";
import { useMemo, useState } from "react";

const MIN_TURNS = 1;
const MAX_TURNS = 10;
const MIN_POINTS = 1;
const MAX_POINTS = 50;

const clampNumber = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const parseInputValue = (
  rawValue: string,
  current: number,
  min: number,
  max: number,
) => {
  const parsedValue = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    return current;
  }

  return clampNumber(parsedValue, min, max);
};

export function OptionsPreview() {
  const [turns, setTurns] = useState(3);
  const [pointsPerTurn, setPointsPerTurn] = useState(10);

  const totalPoints = useMemo(
    () => turns * pointsPerTurn,
    [turns, pointsPerTurn],
  );

  const turnsLabel = turns === 1 ? "turno" : "turnos";
  const pointsLabel = pointsPerTurn === 1 ? "ponto" : "pontos";

  return (
    <section className="mt-9 game-panel-intro">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-[var(--font-cinzel)] text-2xl tracking-wide text-[rgb(239_223_187_/_0.98)]">
          Opções iniciais
        </h2>
      </div>

      <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.84)]">
        Mini game de votação antes da partida: ajuste as regras e comece.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className="game-card rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(11_25_44_/_0.72)] p-4 shadow-[inset_0_0_0_1px_rgb(255_220_150_/_0.06)]">
          <div className="mb-3 inline-flex rounded-lg border border-[rgb(207_168_93_/_0.5)] bg-[rgb(23_47_76_/_0.9)] p-2 text-[rgb(233_205_141_/_0.95)]">
            <Timer className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(214_180_104_/_0.88)]">
            Quantidade de turnos
          </p>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="game-control-button"
              onClick={() =>
                setTurns((current) =>
                  clampNumber(current - 1, MIN_TURNS, MAX_TURNS),
                )
              }
              disabled={turns <= MIN_TURNS}
              aria-label="Diminuir quantidade de turnos"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              inputMode="numeric"
              min={MIN_TURNS}
              max={MAX_TURNS}
              value={turns}
              onChange={(event) =>
                setTurns((current) =>
                  parseInputValue(
                    event.target.value,
                    current,
                    MIN_TURNS,
                    MAX_TURNS,
                  ),
                )
              }
              className="game-number-input w-20 text-center text-xl font-semibold"
              aria-label="Quantidade de turnos"
            />

            <button
              type="button"
              className="game-control-button"
              onClick={() =>
                setTurns((current) =>
                  clampNumber(current + 1, MIN_TURNS, MAX_TURNS),
                )
              }
              disabled={turns >= MAX_TURNS}
              aria-label="Aumentar quantidade de turnos"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.8)]">
            Mínimo 1 e máximo 10 turnos.
          </p>
        </article>

        <article className="game-card rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(11_25_44_/_0.72)] p-4 shadow-[inset_0_0_0_1px_rgb(255_220_150_/_0.06)]">
          <div className="mb-3 inline-flex rounded-lg border border-[rgb(207_168_93_/_0.5)] bg-[rgb(23_47_76_/_0.9)] p-2 text-[rgb(233_205_141_/_0.95)]">
            <Star className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(214_180_104_/_0.88)]">
            Pontos por turno
          </p>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="game-control-button"
              onClick={() =>
                setPointsPerTurn((current) =>
                  clampNumber(current - 1, MIN_POINTS, MAX_POINTS),
                )
              }
              disabled={pointsPerTurn <= MIN_POINTS}
              aria-label="Diminuir pontos por turno"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              inputMode="numeric"
              min={MIN_POINTS}
              max={MAX_POINTS}
              value={pointsPerTurn}
              onChange={(event) =>
                setPointsPerTurn((current) =>
                  parseInputValue(
                    event.target.value,
                    current,
                    MIN_POINTS,
                    MAX_POINTS,
                  ),
                )
              }
              className="game-number-input w-20 text-center text-xl font-semibold"
              aria-label="Quantidade de pontos por turno"
            />

            <button
              type="button"
              className="game-control-button"
              onClick={() =>
                setPointsPerTurn((current) =>
                  clampNumber(current + 1, MIN_POINTS, MAX_POINTS),
                )
              }
              disabled={pointsPerTurn >= MAX_POINTS}
              aria-label="Aumentar pontos por turno"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.8)]">
            Mínimo 1 e máximo 50 pontos.
          </p>
        </article>
      </div>

      <div className="mt-4 rounded-lg border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] px-4 py-3 text-sm text-[rgb(232_209_158_/_0.9)] game-summary-panel">
        Todo turno adiciona +{pointsPerTurn} {pointsLabel}. Com {turns}{" "}
        {turnsLabel}, o total acumulado será {totalPoints} pontos.
      </div>
    </section>
  );
}
