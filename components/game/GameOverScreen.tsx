"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crown, Globe, User } from "lucide-react";
import { CountdownShell, CountdownNumber } from "@/components/game/CountdownDisplay";
import { playReveal, playFanfare } from "@/lib/sounds";
import type {
  ConfigFieldSchema,
  FinalConfig,
  GameConfigSchema,
  TieBreakPending,
  VoteBreakdownEntry,
  VoteScope,
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

type RevealPhase = "countdown" | "spotlight" | "results";

type SpotlightItem = {
  category: string;
  label: string;
  value: string;
  leaderPortrait?: string;
  civIcon?: string;
};

export function GameOverScreen({ votingState, configSchema, leaders, players, isHost, onResolveTie }: Props) {
  const { pendingTieBreaks = [], finalConfig } = votingState;
  const hasTies = pendingTieBreaks.length > 0;

  const [phase, setPhase] = useState<RevealPhase>("countdown");
  const startedRef = useRef(false);

  useEffect(() => {
    if (hasTies || !finalConfig || startedRef.current) return;
    startedRef.current = true;
    setPhase("countdown");
  }, [hasTies, finalConfig]);

  if (hasTies) {
    return (
      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-5 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-8">
        <h1 className="font-[var(--font-cinzel)] text-2xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
          Desempate
        </h1>
        <p className="mt-2 text-sm text-[rgb(206_189_156_/_0.7)]">
          {isHost
            ? "Há empates. Escolha o vencedor para cada campo:"
            : "Aguardando o host resolver os empates…"}
        </p>
        <div className="mt-4 space-y-4">
          {pendingTieBreaks.map((tb, idx) => {
            const label = resolveFieldLabel(tb.scope, tb.field, configSchema, players);
            return (
              <div key={idx} className="rounded-xl border border-[rgb(190_153_81_/_0.35)] bg-[rgb(10_20_34_/_0.78)] p-4">
                <p className="mb-3 text-sm font-semibold text-[rgb(214_178_97_/_0.9)]">
                  {label}{" "}
                  <span className="font-normal text-[rgb(206_189_156_/_0.55)]">— {tb.totalWeight} pts cada</span>
                </p>
                <div className="space-y-1.5">
                  {tb.tiedValues.map((val) => (
                    <div key={String(val)} className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-2">
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
      </div>
    );
  }

  if (!finalConfig) {
    return (
      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-5 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-8">
        <p className="text-sm text-[rgb(206_189_156_/_0.55)]">Consolidando resultados…</p>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <CountdownPhase
        from={3}
        onDone={() => setPhase("spotlight")}
      />
    );
  }

  if (phase === "spotlight") {
    const items = buildSpotlightItems(finalConfig, configSchema, leaders, players);
    return (
      <SpotlightPhase
        items={items}
        onDone={() => { playFanfare(); setPhase("results"); }}
      />
    );
  }

  return (
    <div
      className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-5 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-8"
      style={{ animation: "final-rise 600ms ease-out both" }}
    >
      <div className="flex flex-col items-center text-center">
        <span className="mb-2 font-[var(--font-cinzel)] text-[10px] font-semibold uppercase tracking-[0.32em] text-[rgb(214_178_97_/_0.7)]">
          A vontade do povo
        </span>
        <h1 className="font-[var(--font-cinzel)] text-3xl font-bold leading-tight tracking-wide text-[rgb(239_223_187_/_0.98)] sm:text-4xl" style={{ textShadow: "0 0 40px rgb(214 178 97 / 0.35), 0 2px 6px rgb(0 0 0 / 0.6)" }}>
          Resultado Final
        </h1>
        <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-[rgb(214_178_97_/_0.7)] to-transparent" />
      </div>
      <FinalConfigDisplay
        finalConfig={finalConfig}
        configSchema={configSchema}
        leaders={leaders}
        players={players}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Countdown phase
// ---------------------------------------------------------------------------

function CountdownPhase({ from, onDone }: { from: number; onDone: () => void }) {
  const [count, setCount] = useState(from);
  const doneRef = useRef(false);

  useEffect(() => {
    if (count <= 0) {
      if (!doneRef.current) { doneRef.current = true; onDone(); }
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, onDone]);

  return (
    <CountdownShell subtitle="Revelando resultados...">
      <CountdownNumber key={count} value={count > 0 ? count : ""} animated={count <= 3} />
    </CountdownShell>
  );
}

// ---------------------------------------------------------------------------
// Spotlight phase
// ---------------------------------------------------------------------------

function SpotlightPhase({ items, onDone }: { items: SpotlightItem[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (index >= items.length) {
      if (!doneRef.current) { doneRef.current = true; onDone(); }
      return;
    }
    playReveal();
    const id = setTimeout(() => setIndex((i) => i + 1), 2500);
    return () => clearTimeout(id);
  }, [index, items.length, onDone]);

  if (index >= items.length) return null;

  const item = items[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgb(2_7_15_/_0.92)] backdrop-blur-sm px-6">
      <div
        key={index}
        className="flex flex-col items-center text-center"
        style={{ animation: "spotlight-reveal 2500ms ease-in-out both" }}
      >
        {/* Category badge */}
        <span className="mb-4 rounded-full border border-[rgb(190_153_81_/_0.45)] bg-[rgb(23_47_76_/_0.8)] px-4 py-1 font-[var(--font-cinzel)] text-xs uppercase tracking-widest text-[rgb(214_178_97_/_0.8)]">
          {item.category}
        </span>

        {/* Gold divider */}
        <div
          className="mb-5 h-px w-24 origin-center bg-gradient-to-r from-transparent via-[rgb(214_178_97_/_0.7)] to-transparent"
          style={{ animation: "gold-line-expand 400ms 200ms ease-out both" }}
        />

        {/* Leader portraits (if civ field) */}
        {(item.civIcon || item.leaderPortrait) && (
          <div className="mb-5 flex items-center gap-4">
            {item.civIcon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.civIcon}
                alt=""
                className="h-16 w-16 rounded-xl object-contain bg-[rgb(11_25_44_/_0.6)] p-1.5 border border-[rgb(190_153_81_/_0.3)]"
              />
            )}
            {item.leaderPortrait && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.leaderPortrait}
                alt=""
                className="h-16 w-16 rounded-xl object-contain bg-[rgb(11_25_44_/_0.6)] p-1.5 border border-[rgb(190_153_81_/_0.3)]"
              />
            )}
          </div>
        )}

        {/* Field label */}
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(206_189_156_/_0.6)]">
          {item.label}
        </p>

        {/* Winning value — hero text */}
        <p
          className="font-[var(--font-cinzel)] text-4xl font-bold leading-tight text-[rgb(239_223_187_/_0.98)] sm:text-5xl"
          style={{ textShadow: "0 0 40px rgb(214 178 97 / 0.5), 0 2px 8px rgb(0 0 0 / 0.6)" }}
        >
          {item.value}
        </p>

        {/* Gold divider bottom */}
        <div
          className="mt-5 h-px w-24 origin-center bg-gradient-to-r from-transparent via-[rgb(214_178_97_/_0.7)] to-transparent"
          style={{ animation: "gold-line-expand 400ms 200ms ease-out both" }}
        />
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-10 flex items-center gap-2">
        {items.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? "24px" : "6px",
              background: i === index
                ? "rgb(214 178 97 / 0.9)"
                : i < index
                  ? "rgb(214 178 97 / 0.35)"
                  : "rgb(214 178 97 / 0.15)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Final config display
// ---------------------------------------------------------------------------

type ResultEntry = {
  value: string | number | boolean;
  label: string;
  total: number;
  byVoter: Record<string, number>;
};

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
  const nicknameById = new Map(players.map((p) => [p.id, p.nickname]));
  const matchFields = Object.keys(finalConfig.match);
  const bannedCiv = finalConfig.match.bannedCivilizations;

  return (
    <div className="mt-8 space-y-7">
      {matchFields.length > 0 && (
        <section>
          <SectionHeader
            avatar={
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(190_153_81_/_0.45)] bg-[rgb(23_47_76_/_0.7)] text-[rgb(214_178_97_/_0.85)]">
                <Globe className="h-4 w-4" />
              </div>
            }
            title="Partida"
            subtitle="Configurações globais"
          />
          <div className="space-y-2">
            {matchFields.map((field) => {
              const schema = configSchema?.matchConfig[field];
              const winner = finalConfig.match[field];
              const breakdown = finalConfig.voteBreakdown?.match[field];
              const entries = buildEntries(breakdown, field, "match", configSchema, leaders);
              const winnerEntry = winner !== null
                ? entries.find((e) => String(e.value) === String(winner))
                : undefined;
              return (
                <ResultCard
                  key={field}
                  label={schema?.label ?? field}
                  winnerLabel={winner !== null ? resolveValueLabel(winner, field, "match", configSchema, leaders) : "—"}
                  winnerTotal={winnerEntry?.total ?? 0}
                  entries={entries}
                  nicknameById={nicknameById}
                />
              );
            })}
          </div>
        </section>
      )}

      {players.map((player) => {
        const playerResult = finalConfig.players[player.id];
        if (!playerResult || Object.keys(playerResult).length === 0) return null;
        const playerCiv = playerResult.civilization;
        const civBanned = bannedCiv != null && playerCiv != null && String(playerCiv) === String(bannedCiv);
        const runnerUp = civBanned ? (finalConfig.runnerUpCivilization?.[player.id] ?? null) : null;
        const effectiveCiv = runnerUp ?? playerCiv;
        const leader = typeof effectiveCiv === "number"
          ? leaders.find((l) => l.id === effectiveCiv)
          : undefined;
        return (
          <section key={player.id}>
            <SectionHeader
              avatar={
                leader?.leaderPortrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={leader.leaderPortrait}
                    alt=""
                    className="h-10 w-10 rounded-full border border-[rgb(190_153_81_/_0.45)] object-cover bg-[rgb(11_25_44_/_0.6)]"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(190_153_81_/_0.45)] bg-[rgb(23_47_76_/_0.7)] text-[rgb(214_178_97_/_0.85)]">
                    <User className="h-4 w-4" />
                  </div>
                )
              }
              title={player.nickname}
              subtitle={leader ? `${leader.leader} · ${leader.civilization}` : undefined}
            />
            <div className="space-y-2">
              {Object.entries(playerResult).map(([field, winner]) => {
                const schema = configSchema?.playerConfig[field];
                const isCivField = field === "civilization";
                const banned = isCivField && civBanned;
                const breakdown = finalConfig.voteBreakdown?.players[player.id]?.[field];
                const entries = buildEntries(breakdown, field, { playerId: player.id }, configSchema, leaders);
                const winnerEntry = winner !== null
                  ? entries.find((e) => String(e.value) === String(winner))
                  : undefined;
                return (
                  <ResultCard
                    key={field}
                    label={schema?.label ?? field}
                    winnerLabel={winner !== null ? resolveValueLabel(winner, field, { playerId: player.id }, configSchema, leaders) : "—"}
                    winnerTotal={winnerEntry?.total ?? 0}
                    entries={entries}
                    nicknameById={nicknameById}
                    banned={banned}
                    runnerUpLabel={banned && runnerUp !== null ? resolveValueLabel(runnerUp, "civilization", { playerId: player.id }, configSchema, leaders) : undefined}
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

function SectionHeader({ avatar, title, subtitle }: { avatar: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {avatar}
      <div className="min-w-0 flex-1">
        <h2 className="font-[var(--font-cinzel)] text-lg leading-tight tracking-wide text-[rgb(239_223_187_/_0.95)]">
          {title}
        </h2>
        {subtitle && (
          <p className="truncate text-xs text-[rgb(206_189_156_/_0.6)]">{subtitle}</p>
        )}
      </div>
      <div className="ml-1 h-px flex-1 bg-gradient-to-r from-[rgb(190_153_81_/_0.5)] to-transparent" />
    </div>
  );
}

function ResultCard({
  label,
  winnerLabel,
  winnerTotal,
  entries,
  nicknameById,
  banned,
  runnerUpLabel,
}: {
  label: string;
  winnerLabel: string;
  winnerTotal: number;
  entries: ResultEntry[];
  nicknameById: Map<string, string>;
  banned?: boolean;
  runnerUpLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const canExpand = entries.length > 0;

  return (
    <div className={[
      "overflow-hidden rounded-xl border transition-colors",
      banned
        ? "border-[rgb(220_80_80_/_0.35)] bg-[rgb(40_10_10_/_0.45)]"
        : "border-[rgb(190_153_81_/_0.3)] bg-[rgb(10_20_34_/_0.65)]",
    ].join(" ")}>
      <button
        type="button"
        onClick={() => canExpand && setOpen((o) => !o)}
        disabled={!canExpand}
        className={[
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
          canExpand ? "cursor-pointer hover:bg-[rgb(23_47_76_/_0.35)]" : "cursor-default",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(214_178_97_/_0.7)]">
            <span>{label}</span>
            {banned && (
              <span className="rounded-sm bg-[rgb(220_80_80_/_0.2)] px-1.5 py-0.5 text-[9px] text-[rgb(240_170_170_/_0.95)]">
                banida
              </span>
            )}
          </div>
          <div className={[
            "mt-0.5 font-[var(--font-cinzel)] text-base font-semibold leading-tight sm:text-lg",
            banned
              ? "text-[rgb(220_150_150_/_0.65)] line-through decoration-[rgb(220_80_80_/_0.55)]"
              : "text-[rgb(239_223_187_/_0.96)]",
          ].join(" ")}>
            {winnerLabel}
          </div>
          {banned && runnerUpLabel && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(142_200_140_/_0.85)]">
                2ª opção
              </span>
              <span className="font-[var(--font-cinzel)] text-base font-semibold text-[rgb(200_230_190_/_0.96)]">
                {runnerUpLabel}
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {winnerTotal > 0 && (
            <span className="rounded-full border border-[rgb(190_153_81_/_0.4)] bg-[rgb(11_25_44_/_0.75)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[rgb(214_178_97_/_0.85)]">
              {winnerTotal} pts
            </span>
          )}
          {canExpand && (
            <ChevronDown
              className={[
                "h-4 w-4 text-[rgb(206_189_156_/_0.55)] transition-transform duration-200",
                open ? "rotate-180" : "",
              ].join(" ")}
            />
          )}
        </div>
      </button>

      {open && canExpand && (
        <div className="space-y-2 border-t border-[rgb(190_153_81_/_0.2)] bg-[rgb(6_14_26_/_0.5)] px-4 py-3">
          {entries.map((entry, i) => {
            const isWinner = entry.label === winnerLabel;
            const voters = Object.entries(entry.byVoter).sort((a, b) => b[1] - a[1]);
            return (
              <div
                key={i}
                className={[
                  "rounded-lg border px-3 py-2",
                  isWinner
                    ? "border-[rgb(214_178_97_/_0.45)] bg-[rgb(23_47_76_/_0.55)]"
                    : "border-[rgb(190_153_81_/_0.15)] bg-[rgb(10_20_34_/_0.45)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={[
                    "flex items-center gap-1.5 text-sm font-medium",
                    isWinner ? "text-[rgb(239_223_187_/_0.96)]" : "text-[rgb(206_189_156_/_0.8)]",
                  ].join(" ")}>
                    {isWinner && <Crown className="h-3 w-3 shrink-0 text-[rgb(214_178_97_/_0.85)]" />}
                    <span>{entry.label}</span>
                  </span>
                  <span className={[
                    "shrink-0 tabular-nums text-xs font-semibold",
                    isWinner ? "text-[rgb(214_178_97_/_0.9)]" : "text-[rgb(214_178_97_/_0.65)]",
                  ].join(" ")}>
                    {entry.total} pts
                  </span>
                </div>
                {voters.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {voters.map(([voterId, weight]) => (
                      <li key={voterId} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-[rgb(206_189_156_/_0.6)]">
                          ↳ {nicknameById.get(voterId) ?? "Jogador"}
                        </span>
                        <span className="shrink-0 tabular-nums text-[rgb(206_189_156_/_0.7)]">
                          {weight} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildEntries(
  breakdown: Record<string, VoteBreakdownEntry> | undefined,
  field: string,
  scope: VoteScope | "match",
  configSchema: GameConfigSchema | null,
  leaders: LeaderEntry[],
): ResultEntry[] {
  if (!breakdown) return [];
  return Object.entries(breakdown)
    .map(([rawVal, entry]) => {
      const coerced = coerceRawValue(rawVal);
      return {
        value: coerced,
        label: resolveValueLabel(coerced, field, scope, configSchema, leaders),
        total: entry.total,
        byVoter: entry.byVoter,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function coerceRawValue(raw: string): string | number | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (!Number.isNaN(n) && raw.trim() !== "") return n;
  return raw;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSpotlightItems(
  finalConfig: FinalConfig,
  configSchema: GameConfigSchema | null,
  leaders: LeaderEntry[],
  players: ServerPlayer[],
): SpotlightItem[] {
  const items: SpotlightItem[] = [];

  for (const [field, value] of Object.entries(finalConfig.match)) {
    const schema = configSchema?.matchConfig[field];
    items.push({
      category: "Partida",
      label: schema?.label ?? field,
      value: resolveValueLabel(value, field, "match", configSchema, leaders),
    });
  }

  for (const player of players) {
    const playerResult = finalConfig.players[player.id];
    if (!playerResult) continue;
    for (const [field, value] of Object.entries(playerResult)) {
      const schema = configSchema?.playerConfig[field];
      let leaderPortrait: string | undefined;
      let civIcon: string | undefined;
      if (field === "civilization" && typeof value === "number") {
        const leader = leaders.find((l) => l.id === value);
        leaderPortrait = leader?.leaderPortrait;
        civIcon = leader?.civIcon;
      }
      items.push({
        category: player.nickname,
        label: schema?.label ?? field,
        value: resolveValueLabel(value, field, { playerId: player.id }, configSchema, leaders),
        leaderPortrait,
        civIcon,
      });
    }
  }

  return items;
}

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

  if (schemaField.type === "toggle") return value ? "Ativo" : "Desativado";

  if (schemaField.type === "range") {
    const unit = schemaField.unit ? ` ${schemaField.unit}` : "";
    return `${value}${unit}`;
  }

  return String(value);
}
