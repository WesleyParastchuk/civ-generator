# Game Page New UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the production `GamePage` with the new 3-panel UI built in `DevGamePage` (left area sidebar + center voting fields + right Tesouro/Conselho panel), wired to real session + WebSocket instead of dev fallbacks.

**Architecture:** Extract two sub-components (`HelpTooltip`, `PlayerPip`) into `components/game/`, rewrite `GamePage.tsx` using the new layout + all logic from `DevGamePage.tsx`, and update `page.tsx` to full-height layout. `DevGamePage.tsx` stays unchanged as the dev sandbox.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, PartyKit WebSocket (`partysocket/react`), lucide-react.

---

### Task 1: Move HelpTooltip to shared components

**Files:**
- Create: `components/game/HelpTooltip.tsx`
- Modify: `app/dev/game/[code]/HelpTooltip.tsx` → re-export from new location

- [ ] **Step 1: Copy file to shared location**

Copy `app/dev/game/[code]/HelpTooltip.tsx` verbatim to `components/game/HelpTooltip.tsx`.

- [ ] **Step 2: Replace dev file with re-export**

```tsx
// app/dev/game/[code]/HelpTooltip.tsx
export { HelpTooltip } from "@/components/game/HelpTooltip";
```

- [ ] **Step 3: Verify dev page still compiles**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors referencing HelpTooltip.

- [ ] **Step 4: Commit**

```bash
git add components/game/HelpTooltip.tsx app/dev/game/\[code\]/HelpTooltip.tsx
git commit -m "refactor: move HelpTooltip to shared components/game"
```

---

### Task 2: Extract PlayerPip to shared component

**Files:**
- Create: `components/game/PlayerPip.tsx`
- Modify: `app/dev/game/[code]/DevGamePage.tsx` — remove inline `PlayerPip`, import from shared

The `PlayerPip` component and its CSS classes (`.player-pip`, `.player-pip--lg`, `.player-pip__letter`, `.player-pip__badge`) already live in `app/globals.css` — no CSS changes needed.

- [ ] **Step 1: Create `components/game/PlayerPip.tsx`**

```tsx
"use client";

function playerHue(index: number, total: number): number {
  return Math.round((index * 360) / Math.max(total, 1)) % 360;
}

type Props = {
  index: number;
  total: number;
  nickname: string;
  sealed?: boolean;
  size?: "md" | "lg";
};

export function PlayerPip({ index, total, nickname, sealed = false, size = "md" }: Props) {
  const hue = playerHue(index, total);
  const accent = `hsl(${hue}, 15%, 48%)`;
  const accentDim = `hsl(${hue}, 12%, 34%)`;
  return (
    <div
      className={size === "lg" ? "player-pip player-pip--lg" : "player-pip"}
      style={{
        border: `1px solid ${sealed ? "rgba(79,141,107,0.7)" : accentDim}`,
        background: `linear-gradient(to top, rgb(11,28,52), rgb(11,28,52) 40%, ${accent})`,
        boxShadow: sealed
          ? "0 0 5px rgba(79,141,107,0.7), 0 0 10px rgba(79,141,107,0.4), 0 0 20px rgba(79,141,107,0.2)"
          : undefined,
      }}
    >
      <span className="player-pip__letter" style={{ color: `hsl(${hue}, 85%, 88%)` }}>
        {nickname.charAt(0).toUpperCase()}
      </span>
      {sealed && <div className="player-pip__badge" />}
    </div>
  );
}
```

- [ ] **Step 2: Update DevGamePage.tsx**

Remove the `playerHue` function and `PlayerPip` component from `DevGamePage.tsx` and add the import:

```tsx
import { PlayerPip } from "@/components/game/PlayerPip";
```

- [ ] **Step 3: Verify dev page still compiles**

```bash
npm run lint && npm run build 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/game/PlayerPip.tsx app/dev/game/\[code\]/DevGamePage.tsx
git commit -m "refactor: extract PlayerPip to shared components/game"
```

---

### Task 3: Update page.tsx layout to full-height

The production `page.tsx` currently uses a padded scrollable `main` container. The new 3-panel layout needs full viewport height with no outer scroll.

**Files:**
- Modify: `app/jogo/[code]/game/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

```tsx
import { GamePage } from "./GamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="relative isolate flex h-[100dvh] w-full flex-col overflow-hidden">
      <div className="grain-overlay" aria-hidden />
      <GamePage code={code} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/jogo/\[code\]/game/page.tsx
git commit -m "refactor(game): full-height layout for new 3-panel UI"
```

---

### Task 4: Rewrite GamePage.tsx with new UI

This is the main task. Replace the production `GamePage.tsx` with the new layout from `DevGamePage.tsx`, wired to the real session and WebSocket.

**Key differences from DevGamePage:**
- Session comes from `sessionStorage.getItem(\`game-${code}\`)`, not `DEV_SESSION`
- `votingState` starts as `null` (server sends it), not a prefilled fallback
- No `DEV_FALLBACK_PLAYERS`, `DEV_FALLBACK_VOTING_STATE`, `DEV_SEALED_IDS`, `DEV_MY_ID`
- No local between-turns simulation (server drives transitions)
- Redirect to `/` when no session found (existing production behaviour)
- `iReadyToEnd` resets on turn change (matching production behaviour)

**Files:**
- Modify: `app/jogo/[code]/game/GamePage.tsx` — full rewrite

- [ ] **Step 1: Write new GamePage.tsx**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import usePartySocket from "partysocket/react";
import type {
  ClientMessage,
  ConfigFieldSchema,
  GameConfigSchema,
  ServerMessage,
  ServerPlayer,
  TieBreakPending,
  VoteCast,
  VoteScope,
  VotingState,
} from "@/lib/lobbyTypes";
import { Cloud, Coins, Flag, Globe, Hourglass, Mountain, ScrollText, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HelpTooltip } from "@/components/game/HelpTooltip";
import { PlayerPip } from "@/components/game/PlayerPip";
import { BetweenTurnsOverlay } from "@/components/game/BetweenTurnsOverlay";
import { VotingField, type LeaderEntry } from "@/components/game/VotingField";
import { GameOverScreen } from "@/components/game/GameOverScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameSession = {
  config: { turns: number; pointsPerTurn: number; turnDurationSeconds: number };
  isHost: boolean;
  nickname: string;
};

// ---------------------------------------------------------------------------
// Area config
// ---------------------------------------------------------------------------

const MATCH_AREAS: { id: string; label: string; description: string; icon: LucideIcon; fields: string[] }[] = [
  { id: "terreno",  label: "Terreno", description: "Define a geografia e a vantagem estratégica inicial", icon: Mountain,   fields: ["mapType", "cityStates", "startingPosition"] },
  { id: "mundo",    label: "Mundo",   description: "Afeta riqueza de recursos e expansão territorial",   icon: Globe,      fields: ["resources", "seaLevel"] },
  { id: "clima",    label: "Clima",   description: "Determina os biomas e tipos de terreno do mapa",     icon: Cloud,      fields: ["temperature", "precipitation"] },
  { id: "regras",   label: "Regras",  description: "Altera mecânicas centrais e condições de vitória",   icon: ScrollText, fields: ["barbarians", "tribalVillages", "disabledVictoryConditions", "randomCivicMode", "bannedCivilizations"] },
];

const PLAYER_AREAS: { id: string; label: string; description: string; icon: LucideIcon; fields: string[] }[] = [
  { id: "jogador", label: "Jogador", description: "Define civilização, dificuldade e limites do jogador", icon: User, fields: ["civilization", "difficulty", "maxIdleTurns", "maxCities"] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTurnTally(votes: VoteCast[], scope: VoteScope, field: string): Record<string, number> {
  const scopeId = scope === "match" ? "match" : scope.playerId;
  const result: Record<string, number> = {};
  for (const vote of votes) {
    const vScopeId = vote.scope === "match" ? "match" : vote.scope.playerId;
    if (vScopeId === scopeId && vote.field === field) {
      result[String(vote.value)] = (result[String(vote.value)] ?? 0) + vote.weight;
    }
  }
  return result;
}

function buildMyTurnTally(votes: VoteCast[], voterId: string, scope: VoteScope, field: string): Record<string, number> {
  const scopeId = scope === "match" ? "match" : scope.playerId;
  const result: Record<string, number> = {};
  for (const vote of votes) {
    const vScopeId = vote.scope === "match" ? "match" : vote.scope.playerId;
    if (vote.voterId === voterId && vote.field === field && vScopeId === scopeId) {
      result[String(vote.value)] = (result[String(vote.value)] ?? 0) + vote.weight;
    }
  }
  return result;
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GamePage({ code }: { code: string }) {
  const router = useRouter();
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [myId, setMyId] = useState<string | null>(null);
  const [players, setPlayers] = useState<ServerPlayer[]>([]);
  const [frozenPlayers, setFrozenPlayers] = useState<ServerPlayer[] | null>(null);
  const [votingState, setVotingState] = useState<VotingState | null>(null);
  const [configSchema, setConfigSchema] = useState<GameConfigSchema | null>(null);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);

  const [activeScope, setActiveScope] = useState<VoteScope>("match");
  const [activeArea, setActiveArea] = useState<string>("terreno");
  const [iReadyToEnd, setIReadyToEnd] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const joinSentRef = useRef(false);

  // Read session from sessionStorage (client-side only)
  useEffect(() => {
    const raw = sessionStorage.getItem(`game-${code}`);
    if (!raw) { router.replace("/"); return; }
    setSession(JSON.parse(raw) as GameSession); // eslint-disable-line react-hooks/set-state-in-effect
    setSessionReady(true);
  }, [code, router]);

  // Freeze player list on game over
  useEffect(() => {
    if (votingState?.phase === "game_over" && !frozenPlayers) {
      setFrozenPlayers(players); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [votingState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    const deadline = votingState?.turnDeadline ?? 0;
    if (deadline <= 0) return;
    const update = () => setTimeLeftMs(Math.max(0, deadline - Date.now()));
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [votingState?.turnDeadline]);

  // Fetch config + leaders
  useEffect(() => {
    fetch("/data/config.json")
      .then((r) => r.json())
      .then((data) => setConfigSchema(data as GameConfigSchema))
      .catch(() => {});
    fetch("/data/leaders.json")
      .then((r) => r.json())
      .then((data) => setLeaders((data as { civilizations: LeaderEntry[] }).civilizations))
      .catch(() => {});
  }, []);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: code,
    onOpen() {
      if (joinSentRef.current || !session) return;
      joinSentRef.current = true;
      socket.send(JSON.stringify({
        type: "join",
        payload: { nickname: session.nickname, isHost: session.isHost },
      } satisfies ClientMessage));
    },
    onMessage(evt) {
      const msg = JSON.parse(evt.data as string) as ServerMessage;
      if (msg.type === "welcome") setMyId(msg.payload.connectionId);
      else if (msg.type === "room_update") setPlayers(msg.payload.players);
      else if (msg.type === "voting_state") {
        setVotingState((prev) => {
          if (prev && prev.currentTurn !== msg.payload.currentTurn) setIReadyToEnd(false);
          return msg.payload;
        });
      }
    },
  });

  const sendMsg = (msg: ClientMessage) => socket.send(JSON.stringify(msg));
  const handleVote = (scope: VoteScope, field: string, value: string | number | boolean, weight: number) =>
    sendMsg({ type: "cast_vote", payload: { scope, field, value, weight } });
  const handleRemoveVote = (scope: VoteScope, field: string, value: string | number | boolean) =>
    sendMsg({ type: "remove_vote", payload: { scope, field, value } });
  const handleEndTurn = () => { setIReadyToEnd(true); sendMsg({ type: "end_turn" }); };
  const handleResolveTie = (pending: TieBreakPending, value: string | number | boolean) =>
    sendMsg({ type: "resolve_tie", payload: { scope: pending.scope, field: pending.field, value } });

  if (!sessionReady || !session) return null;

  // Game over
  if (votingState?.phase === "game_over") {
    return (
      <GameOverScreen
        votingState={votingState}
        configSchema={configSchema}
        leaders={leaders}
        players={frozenPlayers ?? players}
        isHost={session.isHost}
        onResolveTie={handleResolveTie}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isMatchScope = activeScope === "match";
  const areas = isMatchScope ? MATCH_AREAS : PLAYER_AREAS;
  const currentArea = areas.find((a) => a.id === activeArea) ?? areas[0];

  const configSection = isMatchScope ? configSchema?.matchConfig : configSchema?.playerConfig;
  const fields: [string, ConfigFieldSchema][] = (currentArea?.fields ?? [])
    .map((key) => [key, configSection?.[key]])
    .filter((entry): entry is [string, ConfigFieldSchema] =>
      typeof entry[1] === "object" && entry[1] !== null && "type" in entry[1],
    );

  const mySpent = votingState ? (votingState.spendByVoter[myId ?? ""] ?? 0) : 0;
  const pointsPerTurn = votingState?.pointsPerTurn ?? session.config.pointsPerTurn;
  const pointsRemaining = pointsPerTurn - mySpent;
  const currentTurn = votingState?.currentTurn ?? 1;
  const totalTurns = votingState?.totalTurns ?? session.config.turns;
  const durationMs = session.config.turnDurationSeconds * 1000;
  const timePct = durationMs > 0 ? timeLeftMs / durationMs : 1;
  const timeColor = timePct < 0.2 ? "text-[rgb(220_80_70)]" : timePct < 0.5 ? "text-[rgb(220_170_60)]" : "text-[rgb(239_223_187)]";
  const treasuryGlow = (votingState?.turnDeadline ?? 0) > 0
    ? timePct < 0.2
      ? "0 0 14px rgb(220 80 70 / 0.55), 0 0 4px rgb(220 80 70 / 0.3), inset 0 0 0 1px rgb(220 80 70 / 0.35)"
      : timePct < 0.5
        ? "0 0 14px rgb(220 170 60 / 0.45), 0 0 4px rgb(220 170 60 / 0.25), inset 0 0 0 1px rgb(220 170 60 / 0.3)"
        : undefined
    : undefined;

  const myVotes = votingState?.currentTurnVotes.filter((v) => v.voterId === (myId ?? "")) ?? [];
  const displayPlayers = frozenPlayers ?? players;

  return (
    <>
      {votingState?.phase === "between_turns" && (
        <BetweenTurnsOverlay
          nextTurn={currentTurn + 1}
          totalTurns={totalTurns}
          betweenDeadline={votingState.betweenTurnsDeadline}
          votes={votingState.currentTurnVotes}
          spendByVoter={votingState.spendByVoter}
          myId={myId ?? ""}
          players={players}
          configSchema={configSchema}
          leaders={leaders}
          pointsPerTurn={pointsPerTurn}
        />
      )}

      <div className="dev-game-bg flex h-full w-full overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <nav className="dev-sidebar-nav flex shrink-0 flex-col items-center gap-3 overflow-y-auto px-3 py-3">
          <div className="dev-areas-label mb-2 shrink-0">ÁREAS</div>
          {areas.map((area) => {
            const Icon = area.icon;
            const active = activeArea === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setActiveArea(area.id)}
                className={`dev-area-btn flex flex-col items-center justify-center gap-1 transition-all duration-150 ${active ? "dev-area-btn-active" : "dev-area-btn-inactive"}`}
              >
                <Icon size="1.75em" strokeWidth={1.5} />
                <span className="dev-area-btn__label">{area.label}</span>
              </button>
            );
          })}
          <div className="mt-auto">
            <HelpTooltip text="Use as áreas para navegar entre grupos de configuração da partida. Clique em uma área para ver e votar nas opções disponíveis naquele grupo." />
          </div>
        </nav>

        {/* ── CENTER: FIELDS ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="dev-area-header flex shrink-0 flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="dev-area-title">{currentArea?.label}</span>
                <span className="dev-turn-pill inline-flex items-center gap-1.5">
                  <Hourglass size={12} strokeWidth={1.5} />
                  Turno {currentTurn} / {totalTurns}
                </span>
                <HelpTooltip text="Cada turno você recebe pontos para votar nas configurações da partida. Quando todos finalizarem o turno, os votos são contabilizados e as configurações com mais votos são aplicadas." />
              </div>
              {currentArea?.description && (
                <div className="dev-area-description">{currentArea.description}</div>
              )}
            </div>

            {/* Scope tabs */}
            <div className="dev-scope-bezel ml-auto flex items-center">
              <button
                type="button"
                onClick={() => { setActiveScope("match"); setActiveArea("terreno"); }}
                className={`dev-scope-tab inline-flex items-center justify-center gap-1.5 ${activeScope === "match" ? "dev-scope-tab-active" : "dev-scope-tab-inactive"}`}
              >
                <Globe size={13} strokeWidth={1.5} />
                Partida
              </button>
              {players.map((p, i) => {
                const active = activeScope !== "match" && (activeScope as { playerId: string }).playerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setActiveScope({ playerId: p.id }); setActiveArea("jogador"); }}
                    className={`dev-scope-tab inline-flex items-center justify-center gap-1.5 ${active ? "dev-scope-tab-active" : "dev-scope-tab-inactive"}`}
                  >
                    <PlayerPip index={i} total={players.length} nickname={p.nickname} sealed={p.id === myId && iReadyToEnd} />
                    {p.nickname}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgb(190_153_81_/_0.2)] hover:[&::-webkit-scrollbar-thumb]:bg-[rgb(190_153_81_/_0.4)]">
            <div className="space-y-5">
              {configSchema && fields.map(([key, schema]) => (
                <div key={key}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(214_180_104_/_0.88)]">
                      {schema.label}
                    </span>
                    {"description" in schema && schema.description && (
                      <span className="text-xs text-[rgb(206_189_156_/_0.4)]">— {schema.description}</span>
                    )}
                  </div>
                  <VotingField
                    fieldKey={key}
                    schema={schema}
                    leaders={leaders}
                    pointsRemaining={pointsRemaining}
                    turnVoteTally={buildTurnTally(votingState?.currentTurnVotes ?? [], activeScope, key)}
                    myTurnVoteTally={myId ? buildMyTurnTally(votingState?.currentTurnVotes ?? [], myId, activeScope, key) : {}}
                    onVote={(value, weight) => handleVote(activeScope, key, value, weight)}
                    onRemoveVote={(value) => handleRemoveVote(activeScope, key, value)}
                  />
                </div>
              ))}
              {!configSchema && (
                <p className="text-sm text-[rgb(206_189_156_/_0.4)]">Carregando opções…</p>
              )}
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="flex w-56 shrink-0 flex-col gap-4 overflow-y-auto border-l border-[rgb(190_153_81_/_0.15)] px-4 py-5">

          {/* Tesouro */}
          <div>
            <div className="flex flex-col items-center rounded-xl border border-[rgb(190_153_81_/_0.25)] bg-[rgb(255_255_255_/_0.04)] p-3 transition-shadow duration-500" style={{ boxShadow: treasuryGlow }}>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="dev-panel-section-label">Tesouro</span>
                <HelpTooltip text="Pontos disponíveis para votar neste turno. Gaste com sabedoria — votos em opções mais distantes do padrão custam mais." />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold tabular-nums text-[rgb(239_223_187)]">{pointsRemaining}</span>
                <Coins className="h-6 w-6 shrink-0 text-[rgb(214_178_97)]" strokeWidth={1.5} />
              </div>
              {(votingState?.turnDeadline ?? 0) > 0 && (
                <div className={`mt-2 flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums ${timeColor}`}>
                  <Hourglass className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {formatCountdown(timeLeftMs)}
                </div>
              )}
            </div>
          </div>

          {/* Conselho */}
          {displayPlayers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="dev-panel-section-label">Conselho</span>
                <HelpTooltip text="Jogadores na partida. Quando todos encerrarem o turno, os votos são contabilizados e as configurações decididas." />
                <span className="ml-auto tabular-nums text-xs text-[rgb(214_178_97_/_0.7)]">
                  {votingState?.readyToEndCount ?? 0}/{votingState?.totalPlayers ?? displayPlayers.length}
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {displayPlayers.map((p, i) => {
                  const isMe = p.id === myId;
                  const isSealed = iReadyToEnd && isMe;
                  return (
                    <li
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 border transition-all duration-100 hover:brightness-125 ${
                        isMe ? "border-[rgb(214_178_97_/_0.55)]" : isSealed ? "border-[rgb(79_141_107_/_0.45)]" : "border-[rgb(255_255_255_/_0.05)]"
                      } ${isSealed ? "bg-[rgb(79_141_107_/_0.1)]" : "bg-[rgb(255_255_255_/_0.03)]"}`}
                      onClick={() => { setActiveScope({ playerId: p.id }); setActiveArea("jogador"); }}
                    >
                      <PlayerPip index={i} total={displayPlayers.length} nickname={p.nickname} sealed={isSealed} size="lg" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold leading-none text-white">{p.nickname}</span>
                          {isMe && (
                            <span className="shrink-0 rounded bg-[rgb(214_178_97_/_0.18)] px-1 py-px text-[0.625rem] font-bold uppercase tracking-wide text-[rgb(214_178_97)]">
                              você
                            </span>
                          )}
                        </div>
                        {isSealed
                          ? <span className="text-[0.6875rem] leading-none text-[rgb(163_212_182_/_0.8)]">Encerrou votação</span>
                          : <span className="text-[0.6875rem] leading-none text-[rgb(206_189_156_/_0.4)]">Votando…</span>
                        }
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Seus votos */}
          {myVotes.length > 0 && (
            <div>
              <span className="dev-panel-section-label">Seus votos</span>
              <ul className="mt-2 space-y-1 text-xs text-[rgb(206_189_156_/_0.6)]">
                {myVotes.map((v, i) => {
                  const scopeLabel = v.scope === "match" ? "Partida" : players.find((p) => p.id === (v.scope as { playerId: string }).playerId)?.nickname ?? "?";
                  const fieldLabel = configSchema
                    ? ((v.scope === "match" ? configSchema.matchConfig : configSchema.playerConfig)[v.field]?.label ?? v.field)
                    : v.field;
                  return (
                    <li key={i} className="flex justify-between gap-1 rounded bg-[rgb(255_255_255_/_0.03)] px-2 py-1">
                      <span className="truncate">{scopeLabel} · {fieldLabel}</span>
                      <span className="shrink-0 tabular-nums text-[rgb(214_178_97_/_0.7)]">{v.weight}pt</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Finalizar votação */}
          <div className="mt-auto pt-2">
            {votingState?.phase === "playing" && (
              <button
                type="button"
                onClick={handleEndTurn}
                disabled={iReadyToEnd}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(255,234,180,0.65)] bg-gradient-to-b from-[rgb(214_178_97)] to-[rgb(172_130_38)] px-3 py-2.5 text-sm font-medium text-[rgb(12_26_44)] shadow-[0_2px_12px_rgb(184_138_45_/_0.35)] transition-all duration-150 hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-px disabled:cursor-default disabled:opacity-50"
              >
                <Flag className="btn-flag-icon h-4 w-4 shrink-0" strokeWidth={2} />
                Finalizar votação
                {(votingState.totalPlayers > 1) && (
                  <span className="rounded-full border border-[rgb(12_26_44_/_0.25)] bg-[rgb(12_26_44_/_0.15)] px-1.5 py-0.5 text-xs tabular-nums text-[rgb(12_26_44_/_0.8)]">
                    {votingState.readyToEndCount}/{votingState.totalPlayers}
                  </span>
                )}
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: no errors in `GamePage.tsx`.

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -30
```
Expected: clean build.

- [ ] **Step 4: Manual smoke test**

Start dev server (`npm run dev`), open `http://localhost:3000`, create a room, start the game, and verify:
- 3-panel layout appears (sidebar, center, right panel)
- Area navigation works
- Scope tabs show players
- Tesouro shows correct remaining points
- Timer counts down (if `turnDurationSeconds > 0`)
- Conselho shows all players, "você" badge on self
- Clicking a Conselho card opens that player's scope
- "Finalizar votação" sends `end_turn` and disables button
- Game over screen still works

- [ ] **Step 5: Commit**

```bash
git add app/jogo/\[code\]/game/GamePage.tsx
git commit -m "feat(game): new 3-panel UI with area sidebar and Tesouro/Conselho panels"
```

---

### Task 5: Verify DevGamePage still works

After shared component extraction, confirm the dev sandbox is unaffected.

- [ ] **Step 1: Open dev sandbox**

Navigate to `http://localhost:3000/dev/game/test-room` and verify all panels, animations, and interactions work identically to before.

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "chore: verify dev sandbox after shared component extraction"
```

---

## Self-Review

**Spec coverage:**
- ✅ Extract HelpTooltip → Task 1
- ✅ Extract PlayerPip → Task 2
- ✅ Full-height layout → Task 3
- ✅ Real session from sessionStorage → Task 4
- ✅ Real WebSocket, no DEV_ constants → Task 4
- ✅ Area sidebar navigation → Task 4
- ✅ Right panel: Tesouro, Conselho, Finalizar votação → Task 4
- ✅ Countdown timer, neon glow → Task 4
- ✅ DevGamePage unaffected → Task 5

**Type consistency:** All types (`VotingState`, `ServerPlayer`, `VoteScope`, `ClientMessage`) imported from `@/lib/lobbyTypes` throughout. `PlayerPip` props match usage in Tasks 2 and 4.

**No placeholders:** All code blocks are complete. No TBDs.
