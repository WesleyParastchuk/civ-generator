"use client";

import { Minus, Plus, Star, Timer, Clock } from "lucide-react";
import type { RoomConfig } from "@/lib/lobbyTypes";
import { MIN_TURNS, MAX_TURNS, MIN_POINTS, MAX_POINTS, DURATION_PRESETS } from "@/components/home/OptionsPreview";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const parse = (raw: string, cur: number, min: number, max: number) => {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? cur : clamp(n, min, max);
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, "0")} min`;
}

type Props = {
  config: RoomConfig;
  editable: boolean;
  onChange?: (config: RoomConfig) => void;
};

export function ConfigPanel({ config, editable, onChange }: Props) {
  const { turns, pointsPerTurn, turnDurationSeconds } = config;
  const totalPoints = turns * pointsPerTurn;
  const turnsLabel = turns === 1 ? "turno" : "turnos";
  const pointsLabel = pointsPerTurn === 1 ? "ponto" : "pontos";

  const setTurns = (v: number) => onChange?.({ ...config, turns: v });
  const setPoints = (v: number) => onChange?.({ ...config, pointsPerTurn: v });
  const setDuration = (v: number) => onChange?.({ ...config, turnDurationSeconds: v });

  if (!editable) {
    return (
      <div className="rounded-lg border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] px-4 py-3 text-sm text-[rgb(232_209_158_/_0.9)] game-summary-panel">
        Todo turno adiciona +{pointsPerTurn} {pointsLabel}. Com {turns} {turnsLabel}, o total
        acumulado será {totalPoints} pontos. Tempo por turno: {formatDuration(turnDurationSeconds ?? 120)}.
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-[var(--font-cinzel)] text-2xl tracking-wide text-[rgb(239_223_187_/_0.98)]">
        Opções da partida
      </h2>

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
              onClick={() => setTurns(clamp(turns - 1, MIN_TURNS, MAX_TURNS))}
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
              onChange={(e) => setTurns(parse(e.target.value, turns, MIN_TURNS, MAX_TURNS))}
              className="game-number-input w-20 text-center text-xl font-semibold"
              aria-label="Quantidade de turnos"
            />
            <button
              type="button"
              className="game-control-button"
              onClick={() => setTurns(clamp(turns + 1, MIN_TURNS, MAX_TURNS))}
              disabled={turns >= MAX_TURNS}
              aria-label="Aumentar quantidade de turnos"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.8)]">Mínimo 1 e máximo 10 turnos.</p>
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
              onClick={() => setPoints(clamp(pointsPerTurn - 1, MIN_POINTS, MAX_POINTS))}
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
              onChange={(e) =>
                setPoints(parse(e.target.value, pointsPerTurn, MIN_POINTS, MAX_POINTS))
              }
              className="game-number-input w-20 text-center text-xl font-semibold"
              aria-label="Quantidade de pontos por turno"
            />
            <button
              type="button"
              className="game-control-button"
              onClick={() => setPoints(clamp(pointsPerTurn + 1, MIN_POINTS, MAX_POINTS))}
              disabled={pointsPerTurn >= MAX_POINTS}
              aria-label="Aumentar pontos por turno"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.8)]">Mínimo 1 e máximo 50 pontos.</p>
        </article>

        <article className="game-card col-span-full rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(11_25_44_/_0.72)] p-4 shadow-[inset_0_0_0_1px_rgb(255_220_150_/_0.06)]">
          <div className="mb-3 inline-flex rounded-lg border border-[rgb(207_168_93_/_0.5)] bg-[rgb(23_47_76_/_0.9)] p-2 text-[rgb(233_205_141_/_0.95)]">
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(214_180_104_/_0.88)]">
            Tempo por turno
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.seconds}
                type="button"
                onClick={() => setDuration(p.seconds)}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                  (turnDurationSeconds ?? 120) === p.seconds
                    ? "border-[rgb(214_178_97_/_0.7)] bg-[rgb(23_47_76_/_0.9)] text-[rgb(239_223_187_/_0.95)]"
                    : "border-[rgb(190_153_81_/_0.25)] bg-transparent text-[rgb(206_189_156_/_0.6)] hover:text-[rgb(206_189_156_/_0.9)]",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 rounded-lg border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] px-4 py-3 text-sm text-[rgb(232_209_158_/_0.9)] game-summary-panel">
        Todo turno adiciona +{pointsPerTurn} {pointsLabel}. Com {turns} {turnsLabel}, o total
        acumulado será {totalPoints} pontos. Tempo por turno: {formatDuration(turnDurationSeconds ?? 120)}.
      </div>
    </section>
  );
}
