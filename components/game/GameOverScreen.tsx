"use client";

import type {
  ConfigFieldSchema,
  FinalConfig,
  GameConfigSchema,
  TieBreakPending,
  VotingState,
} from "@/lib/lobbyTypes";
import type { LeaderEntry } from "./VotingField";
import type { ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  votingState: VotingState;
  configSchema: GameConfigSchema | null;
  leaders: LeaderEntry[];
  players: ServerPlayer[];
  isHost: boolean;
  onResolveTie: (pending: TieBreakPending, value: string | number | boolean) => void;
};

export function GameOverScreen({ votingState, configSchema, leaders, players, isHost, onResolveTie }: Props) {
  const { pendingTieBreaks = [], finalConfig } = votingState;
  const hasTies = pendingTieBreaks.length > 0;

  return (
    <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-5 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-8">
      <h1 className="font-[var(--font-cinzel)] text-2xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
        {hasTies ? "Desempate" : "Resultado Final"}
      </h1>

      {hasTies && (
        <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.7)]">
          {isHost
            ? "Há empates. Escolha o vencedor para cada campo:"
            : "Aguardando o host resolver os empates…"}
        </p>
      )}

      {/* Tie-break resolution */}
      {hasTies && (
        <div className="mt-4 space-y-4">
          {pendingTieBreaks.map((tb, idx) => {
            const label = resolveFieldLabel(tb.scope, tb.field, configSchema, players);
            return (
              <div
                key={idx}
                className="rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] p-4"
              >
                <p className="mb-3 text-sm font-semibold text-[rgb(214_178_97_/_0.9)]">
                  {label}{" "}
                  <span className="text-[rgb(206_189_156_/_0.55)] font-normal">
                    — {tb.totalWeight} pts cada
                  </span>
                </p>
                <div className="space-y-1.5">
                  {tb.tiedValues.map((val) => (
                    <div
                      key={String(val)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-2"
                    >
                      <span className="text-sm text-[rgb(232_209_158_/_0.9)]">
                        {resolveValueLabel(val, tb.field, tb.scope, configSchema, leaders)}
                      </span>
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => onResolveTie(tb, val)}
                          className="game-control-button h-7 rounded-lg px-3 text-xs font-semibold"
                        >
                          Escolher
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final config display */}
      {!hasTies && finalConfig && (
        <FinalConfigDisplay
          finalConfig={finalConfig}
          configSchema={configSchema}
          leaders={leaders}
          players={players}
        />
      )}

      {!hasTies && !finalConfig && (
        <p className="mt-4 text-sm text-[rgb(206_189_156_/_0.55)]">Consolidando resultados…</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Final config display
// ---------------------------------------------------------------------------

function FinalConfigDisplay({
  finalConfig,
  configSchema,
  leaders,
  players,
}: {
  finalConfig: FinalConfig;
  configSchema: GameConfigSchema | null;
  leaders: LeaderEntry[];
  players: ServerPlayer[];
}) {
  return (
    <div className="mt-5 space-y-6">
      {/* Match config */}
      {Object.keys(finalConfig.match).length > 0 && (
        <section>
          <h2 className="mb-3 font-[var(--font-cinzel)] text-lg tracking-wide text-[rgb(239_223_187_/_0.9)]">
            Partida
          </h2>
          <div className="space-y-1.5">
            {Object.entries(finalConfig.match).map(([field, value]) => {
              const schema = configSchema?.matchConfig[field];
              return (
                <ResultRow
                  key={field}
                  label={schema?.label ?? field}
                  value={resolveValueLabel(value, field, "match", configSchema, leaders)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Per-player config */}
      {players.map((player) => {
        const playerResult = finalConfig.players[player.id];
        if (!playerResult || Object.keys(playerResult).length === 0) return null;
        return (
          <section key={player.id}>
            <h2 className="mb-3 font-[var(--font-cinzel)] text-lg tracking-wide text-[rgb(239_223_187_/_0.9)]">
              {player.nickname}
            </h2>
            <div className="space-y-1.5">
              {Object.entries(playerResult).map(([field, value]) => {
                const schema = configSchema?.playerConfig[field];
                return (
                  <ResultRow
                    key={field}
                    label={schema?.label ?? field}
                    value={resolveValueLabel(value, field, { playerId: player.id }, configSchema, leaders)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(214_178_97_/_0.75)]">
        {label}
      </span>
      <span className="text-sm text-[rgb(232_209_158_/_0.9)]">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveFieldLabel(
  scope: TieBreakPending["scope"],
  field: string,
  configSchema: GameConfigSchema | null,
  players: ServerPlayer[],
): string {
  const schemaField = scope === "match"
    ? configSchema?.matchConfig[field]
    : configSchema?.playerConfig[field];
  const fieldLabel = schemaField?.label ?? field;

  if (scope === "match") return fieldLabel;
  const player = players.find((p) => p.id === scope.playerId);
  return `${player?.nickname ?? "Jogador"} — ${fieldLabel}`;
}

function resolveValueLabel(
  value: string | number | boolean | null,
  field: string,
  scope: TieBreakPending["scope"] | "match",
  configSchema: GameConfigSchema | null,
  leaders: LeaderEntry[],
): string {
  if (value === null) return "—";
  const schemaField: ConfigFieldSchema | undefined = scope === "match"
    ? configSchema?.matchConfig[field]
    : configSchema?.playerConfig[field];

  if (!schemaField) return String(value);

  if (schemaField.type === "select") {
    if (schemaField.options) {
      const opt = schemaField.options.find((o) => String(o.value) === String(value));
      if (opt) return opt.label;
    }
    if (schemaField.leadersSource) {
      const leader = leaders.find((l) => l.id === Number(value));
      if (leader) return `${leader.leader} (${leader.civilization})`;
    }
  }

  if (schemaField.type === "toggle") {
    return value ? "Ativo" : "Desativado";
  }

  if (schemaField.type === "range") {
    const unit = schemaField.unit ? ` ${schemaField.unit}` : "";
    return `${value}${unit}`;
  }

  return String(value);
}
