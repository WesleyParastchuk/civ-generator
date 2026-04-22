# Waiting Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar criação de sala e sala de espera multijogador em tempo real ao Civ VI pre-game mini-game.

**Architecture:** O cliente gera um código de 6 caracteres, salva a config no `sessionStorage`, e navega para `/jogo/[code]`. A página conecta ao PartyKit via WebSocket — host envia config no `join`, visitantes entram pelo formulário de nickname. O PartyKit mantém o estado in-memory, faz broadcast para todos os clientes a cada mudança, e limpa a sala após 30 min de inatividade.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, lucide-react, PartyKit (`partykit` CLI + `partysocket` cliente)

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `party/index.ts` | Criar | PartyKit server: estado, mensagens, cleanup |
| `partykit.json` | Criar | Config do projeto PartyKit |
| `.env.local` | Modificar | `NEXT_PUBLIC_PARTYKIT_HOST` |
| `lib/lobbyTypes.ts` | Criar | Tipos compartilhados de mensagens cliente↔servidor |
| `lib/generateRoomCode.ts` | Criar | Geração de código com `crypto.getRandomValues` |
| `lib/sessionLobby.ts` | Criar | get/set/clear de dados do lobby no `sessionStorage` |
| `components/home/HeroPanel.tsx` | Modificar | Lift state de OptionsPreview + submit navega ao lobby |
| `components/home/OptionsPreview.tsx` | Modificar | Converter para componente controlado (props externas) |
| `components/lobby/NicknameGate.tsx` | Criar | Formulário de nickname para visitantes |
| `components/lobby/RoomConfigBadge.tsx` | Criar | Badges de turnos e pontos |
| `components/lobby/PlayerCard.tsx` | Criar | Card individual de jogador com status |
| `components/lobby/PlayerList.tsx` | Criar | Grid de PlayerCards |
| `components/lobby/ReadyButton.tsx` | Criar | Botão toggle pronto/cancelar |
| `components/lobby/RoomCodeDisplay.tsx` | Criar | Código da sala + botões copiar/compartilhar |
| `components/lobby/LobbyPanel.tsx` | Criar | Container principal da sala de espera |
| `app/jogo/[code]/page.tsx` | Criar | Server Component wrapper da rota |
| `app/jogo/[code]/LobbyPage.tsx` | Criar | Client Component: lógica de conexão PartyKit |

---

## Task 1: Instalar dependências e configurar PartyKit

**Files:**
- Modify: `package.json` (via npm)
- Create: `partykit.json`
- Modify: `.env.local`

- [ ] **Instalar `partysocket`**

```bash
npm install partysocket
```

Expected: `partysocket` aparece em `dependencies` no `package.json`.

- [ ] **Criar `partykit.json`** na raiz do projeto

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "civ-generator",
  "main": "party/index.ts"
}
```

- [ ] **Adicionar variável de ambiente** em `.env.local` (crie o arquivo se não existir)

```
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

- [ ] **Commit**

```bash
git add partykit.json .env.local package.json package-lock.json
git commit -m "chore: add PartyKit config and partysocket dependency"
```

---

## Task 2: Tipos compartilhados

**Files:**
- Create: `lib/lobbyTypes.ts`

- [ ] **Criar `lib/lobbyTypes.ts`**

```ts
export type RoomConfig = {
  turns: number;
  pointsPerTurn: number;
};

export type Player = {
  nickname: string;
  ready: boolean;
  isHost: boolean;
};

export type ServerPlayer = Player & { id: string };

// Mensagens cliente → servidor
export type ClientMessage =
  | { type: "join"; payload: { nickname: string; isHost: boolean; config?: RoomConfig } }
  | { type: "toggle_ready" }
  | { type: "ping" };

// Mensagens servidor → cliente
export type ServerMessage =
  | { type: "welcome"; payload: { connectionId: string } }
  | { type: "room_update"; payload: { config: RoomConfig | null; players: ServerPlayer[] } }
  | { type: "room_expired" };
```

- [ ] **Verificar** que não há erros de TypeScript:

```bash
npx tsc --noEmit
```

Expected: saída vazia (sem erros).

- [ ] **Commit**

```bash
git add lib/lobbyTypes.ts
git commit -m "feat: add shared lobby message types"
```

---

## Task 3: Utilitário generateRoomCode

**Files:**
- Create: `lib/generateRoomCode.ts`

- [ ] **Criar `lib/generateRoomCode.ts`**

Charset sem caracteres ambíguos (sem O/0, I/1):

```ts
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
}
```

- [ ] **Verificar TypeScript:**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add lib/generateRoomCode.ts
git commit -m "feat: add room code generator using crypto.getRandomValues"
```

---

## Task 4: Utilitário sessionLobby

**Files:**
- Create: `lib/sessionLobby.ts`

- [ ] **Criar `lib/sessionLobby.ts`**

```ts
import type { RoomConfig } from "./lobbyTypes";

export type LobbySession = {
  nickname: string;
  isHost: boolean;
  config: RoomConfig | null;
};

export function saveLobbySession(code: string, data: LobbySession): void {
  sessionStorage.setItem(`lobby-${code}`, JSON.stringify(data));
}

export function getLobbySession(code: string): LobbySession | null {
  const raw = sessionStorage.getItem(`lobby-${code}`);
  if (!raw) return null;
  return JSON.parse(raw) as LobbySession;
}

export function clearLobbySession(code: string): void {
  sessionStorage.removeItem(`lobby-${code}`);
}
```

- [ ] **Verificar TypeScript:**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add lib/sessionLobby.ts
git commit -m "feat: add sessionStorage helpers for lobby data"
```

---

## Task 5: PartyKit server

**Files:**
- Create: `party/index.ts`

- [ ] **Criar diretório e arquivo `party/index.ts`**

```ts
import type * as Party from "partykit/server";
import type { ClientMessage, RoomConfig, ServerMessage, ServerPlayer } from "../lib/lobbyTypes";

const INACTIVITY_MS = 30 * 60 * 1000;

export default class LobbyServer implements Party.Server {
  players: Map<string, Player> = new Map();
  config: RoomConfig | null = null;
  cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(_conn: Party.Connection) {
    this.resetTimer();
  }

  onMessage(message: string, sender: Party.Connection) {
    this.resetTimer();
    const msg = JSON.parse(message) as ClientMessage;

    if (msg.type === "join") {
      const { nickname, isHost, config } = msg.payload;
      if (isHost && config) this.config = config;
      this.players.set(sender.id, { nickname, ready: false, isHost });
      const welcome: ServerMessage = { type: "welcome", payload: { connectionId: sender.id } };
      sender.send(JSON.stringify(welcome));
      this.broadcast();
    } else if (msg.type === "toggle_ready") {
      const player = this.players.get(sender.id);
      if (player) {
        player.ready = !player.ready;
        this.broadcast();
      }
    }
    // ping: timer já foi resetado acima, nada mais a fazer
  }

  onClose(conn: Party.Connection) {
    this.players.delete(conn.id);
    if (this.players.size === 0) {
      if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
      return;
    }
    this.broadcast();
    this.resetTimer();
  }

  broadcast() {
    const players: ServerPlayer[] = Array.from(this.players.entries()).map(
      ([id, p]) => ({ id, ...p })
    );
    const msg: ServerMessage = {
      type: "room_update",
      payload: { config: this.config, players },
    };
    this.room.broadcast(JSON.stringify(msg));
  }

  resetTimer() {
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
    this.cleanupTimer = setTimeout(() => {
      const msg: ServerMessage = { type: "room_expired" };
      this.room.broadcast(JSON.stringify(msg));
      for (const conn of this.room.getConnections()) {
        conn.close();
      }
    }, INACTIVITY_MS);
  }
}

LobbyServer satisfies Party.Worker;
```

- [ ] **Verificar TypeScript:**

```bash
npx tsc --noEmit
```

- [ ] **Testar o servidor PartyKit localmente:**

```bash
npx partykit dev
```

Expected: `PartyKit dev server running on http://localhost:1999` (ou similar). Ctrl+C para encerrar.

- [ ] **Commit**

```bash
git add party/index.ts
git commit -m "feat: add PartyKit lobby server with inactivity cleanup"
```

---

## Task 6: Atualizar OptionsPreview para componente controlado

**Files:**
- Modify: `components/home/OptionsPreview.tsx`

O `HeroPanel` precisa acessar `turns` e `pointsPerTurn` para salvar no `sessionStorage`. Por isso, o estado sobe para `HeroPanel` e `OptionsPreview` vira controlado.

- [ ] **Substituir `components/home/OptionsPreview.tsx`** pelo seguinte:

```tsx
"use client";

import { Minus, Plus, Star, Timer } from "lucide-react";
import { useMemo } from "react";

export const MIN_TURNS = 1;
export const MAX_TURNS = 10;
export const MIN_POINTS = 1;
export const MAX_POINTS = 50;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseInputValue = (raw: string, current: number, min: number, max: number) => {
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? current : clampNumber(parsed, min, max);
};

type Props = {
  turns: number;
  onTurnsChange: (v: number) => void;
  pointsPerTurn: number;
  onPointsPerTurnChange: (v: number) => void;
};

export function OptionsPreview({ turns, onTurnsChange, pointsPerTurn, onPointsPerTurnChange }: Props) {
  const totalPoints = useMemo(() => turns * pointsPerTurn, [turns, pointsPerTurn]);
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
              onClick={() => onTurnsChange(clampNumber(turns - 1, MIN_TURNS, MAX_TURNS))}
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
              onChange={(e) => onTurnsChange(parseInputValue(e.target.value, turns, MIN_TURNS, MAX_TURNS))}
              className="game-number-input w-20 text-center text-xl font-semibold"
              aria-label="Quantidade de turnos"
            />
            <button
              type="button"
              className="game-control-button"
              onClick={() => onTurnsChange(clampNumber(turns + 1, MIN_TURNS, MAX_TURNS))}
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
              onClick={() => onPointsPerTurnChange(clampNumber(pointsPerTurn - 1, MIN_POINTS, MAX_POINTS))}
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
              onChange={(e) => onPointsPerTurnChange(parseInputValue(e.target.value, pointsPerTurn, MIN_POINTS, MAX_POINTS))}
              className="game-number-input w-20 text-center text-xl font-semibold"
              aria-label="Quantidade de pontos por turno"
            />
            <button
              type="button"
              className="game-control-button"
              onClick={() => onPointsPerTurnChange(clampNumber(pointsPerTurn + 1, MIN_POINTS, MAX_POINTS))}
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
        Todo turno adiciona +{pointsPerTurn} {pointsLabel}. Com {turns} {turnsLabel}, o total acumulado será {totalPoints} pontos.
      </div>
    </section>
  );
}
```

- [ ] **Verificar TypeScript:**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add components/home/OptionsPreview.tsx
git commit -m "refactor: convert OptionsPreview to controlled component"
```

---

## Task 7: Atualizar HeroPanel (lift state + navegação ao lobby)

**Files:**
- Modify: `components/home/HeroPanel.tsx`

- [ ] **Substituir `components/home/HeroPanel.tsx`** pelo seguinte:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Compass, Crown, UsersRound } from "lucide-react";
import { OptionsPreview } from "./OptionsPreview";
import { StartButton } from "./StartButton";
import { generateRoomCode } from "@/lib/generateRoomCode";
import { saveLobbySession } from "@/lib/sessionLobby";

export default function HeroPanel() {
  const router = useRouter();
  const [turns, setTurns] = useState(3);
  const [pointsPerTurn, setPointsPerTurn] = useState(10);

  const handleStartSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nickname = (formData.get("playerNickname") as string).trim();
    if (!nickname) return;

    const code = generateRoomCode();
    saveLobbySession(code, { nickname, isHost: true, config: { turns, pointsPerTurn } });
    router.push(`/jogo/${code}`);
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

        <OptionsPreview
          turns={turns}
          onTurnsChange={setTurns}
          pointsPerTurn={pointsPerTurn}
          onPointsPerTurnChange={setPointsPerTurn}
        />
      </div>
    </section>
  );
}
```

- [ ] **Verificar TypeScript e testar página inicial:**

```bash
npx tsc --noEmit
npm run dev
```

Abrir `http://localhost:3000`, preencher nickname e clicar "Iniciar seleção". Deve navegar para `/jogo/XXXXXX` (página 404 por enquanto — normal).

- [ ] **Commit**

```bash
git add components/home/HeroPanel.tsx
git commit -m "feat: HeroPanel generates room code and navigates to lobby"
```

---

## Task 8: Componente NicknameGate

**Files:**
- Create: `components/lobby/NicknameGate.tsx`

- [ ] **Criar `components/lobby/NicknameGate.tsx`**

```tsx
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
```

- [ ] **Verificar TypeScript:**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add components/lobby/NicknameGate.tsx
git commit -m "feat: add NicknameGate component for lobby visitors"
```

---

## Task 9: Componente RoomConfigBadge

**Files:**
- Create: `components/lobby/RoomConfigBadge.tsx`

- [ ] **Criar `components/lobby/RoomConfigBadge.tsx`**

```tsx
import { Star, Timer } from "lucide-react";

type Props = {
  turns: number;
  pointsPerTurn: number;
};

export function RoomConfigBadge({ turns, pointsPerTurn }: Props) {
  const turnsLabel = turns === 1 ? "turno" : "turnos";
  const pointsLabel = pointsPerTurn === 1 ? "ponto/turno" : "pontos/turno";

  return (
    <>
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)]">
        <Timer className="h-3.5 w-3.5 shrink-0" />
        <span>{turns} {turnsLabel}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)]">
        <Star className="h-3.5 w-3.5 shrink-0" />
        <span>{pointsPerTurn} {pointsLabel}</span>
      </div>
    </>
  );
}
```

- [ ] **Commit**

```bash
git add components/lobby/RoomConfigBadge.tsx
git commit -m "feat: add RoomConfigBadge component"
```

---

## Task 10: Componente PlayerCard

**Files:**
- Create: `components/lobby/PlayerCard.tsx`

- [ ] **Criar `components/lobby/PlayerCard.tsx`**

```tsx
import { Crown, Hourglass, ShieldCheck } from "lucide-react";
import type { ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  player: ServerPlayer;
  isMe: boolean;
};

export function PlayerCard({ player, isMe }: Props) {
  return (
    <article
      className={[
        "game-card rounded-xl border p-4 shadow-[inset_0_0_0_1px_rgb(255_220_150_/_0.06)] transition-all",
        player.ready
          ? "border-[rgb(214_178_97_/_0.65)] bg-[rgb(14_32_54_/_0.88)]"
          : "border-[rgb(190_153_81_/_0.25)] bg-[rgb(11_25_44_/_0.72)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {player.isHost && (
            <Crown className="h-3.5 w-3.5 shrink-0 text-[rgb(233_205_141_/_0.9)]" />
          )}
          <span className="truncate font-semibold text-[rgb(239_223_187_/_0.95)]">
            {player.nickname}
            {isMe && (
              <span className="ml-1.5 text-xs font-normal text-[rgb(206_189_156_/_0.6)]">(você)</span>
            )}
          </span>
        </div>
        {player.ready ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-[rgb(160_210_130_/_0.9)]" />
        ) : (
          <Hourglass className="h-5 w-5 shrink-0 text-[rgb(206_189_156_/_0.5)]" />
        )}
      </div>
      <p className={[
        "mt-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
        player.ready
          ? "text-[rgb(160_210_130_/_0.85)]"
          : "text-[rgb(206_189_156_/_0.55)]",
      ].join(" ")}>
        {player.ready ? "Pronto" : "Aguardando"}
      </p>
    </article>
  );
}
```

- [ ] **Commit**

```bash
git add components/lobby/PlayerCard.tsx
git commit -m "feat: add PlayerCard component with ready/waiting states"
```

---

## Task 11: Componente PlayerList

**Files:**
- Create: `components/lobby/PlayerList.tsx`

- [ ] **Criar `components/lobby/PlayerList.tsx`**

```tsx
import { PlayerCard } from "./PlayerCard";
import type { ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  players: ServerPlayer[];
  myId: string | null;
  className?: string;
};

export function PlayerList({ players, myId, className = "" }: Props) {
  return (
    <div className={className}>
      <h2 className="font-[var(--font-cinzel)] text-lg tracking-wide text-[rgb(239_223_187_/_0.98)]">
        Jogadores
        <span className="ml-2 font-sans text-sm font-normal text-[rgb(206_189_156_/_0.6)]">
          ({players.length})
        </span>
      </h2>
      {players.length === 0 ? (
        <p className="mt-3 text-sm text-[rgb(206_189_156_/_0.55)]">
          Aguardando jogadores...
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={player.id === myId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/lobby/PlayerList.tsx
git commit -m "feat: add PlayerList component"
```

---

## Task 12: Componente ReadyButton

**Files:**
- Create: `components/lobby/ReadyButton.tsx`

- [ ] **Criar `components/lobby/ReadyButton.tsx`**

```tsx
import { Swords, X } from "lucide-react";

type Props = {
  ready: boolean;
  onToggle: () => void;
};

export function ReadyButton({ ready, onToggle }: Props) {
  if (ready) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-6 py-4 text-lg font-semibold tracking-wide text-[rgb(206_189_156_/_0.8)] shadow-[0_4px_12px_rgb(3_8_16_/_0.3)] transition-all hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgb(247_227_179_/_0.95)] sm:w-auto"
        aria-label="Cancelar pronto"
      >
        <X className="h-5 w-5" />
        Cancelar pronto
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(225_194_127_/_0.62)] bg-[linear-gradient(180deg,_rgb(226_184_98_/_0.9)_0%,_rgb(160_116_38_/_0.95)_100%)] px-6 py-4 text-lg font-semibold tracking-wide text-[rgb(25_14_3_/_0.95)] shadow-[0_10px_24px_rgb(3_8_16_/_0.45)] transition-all hover:translate-y-[-2px] hover:brightness-105 hover:saturate-125 hover:shadow-[0_16px_30px_rgb(3_8_16_/_0.52)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgb(247_227_179_/_0.95)] sm:w-auto"
      aria-label="Marcar como pronto"
    >
      <Swords className="h-5 w-5 transition-transform group-hover:rotate-[-10deg]" />
      Pronto
    </button>
  );
}
```

- [ ] **Commit**

```bash
git add components/lobby/ReadyButton.tsx
git commit -m "feat: add ReadyButton component with ready/cancel states"
```

---

## Task 13: Componente RoomCodeDisplay

**Files:**
- Create: `components/lobby/RoomCodeDisplay.tsx`

- [ ] **Criar `components/lobby/RoomCodeDisplay.tsx`**

```tsx
"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  code: string;
};

export function RoomCodeDisplay({ code }: Props) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Sala Civ VI", url }).catch(() => {});
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(206_189_156_/_0.7)]">
          Código da sala
        </p>
        <p className="mt-1 font-[var(--font-cinzel)] text-4xl font-bold tracking-[0.2em] text-[rgb(239_223_187_/_0.98)]">
          {code}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="game-control-button w-auto px-3 gap-1.5 text-xs font-semibold uppercase tracking-[0.1em]"
          aria-label="Copiar link da sala"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copiado!" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="game-control-button w-auto px-3 gap-1.5 text-xs font-semibold uppercase tracking-[0.1em]"
          aria-label="Compartilhar sala"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/lobby/RoomCodeDisplay.tsx
git commit -m "feat: add RoomCodeDisplay with copy and share buttons"
```

---

## Task 14: Componente LobbyPanel

**Files:**
- Create: `components/lobby/LobbyPanel.tsx`

- [ ] **Criar `components/lobby/LobbyPanel.tsx`**

```tsx
import { RoomCodeDisplay } from "./RoomCodeDisplay";
import { RoomConfigBadge } from "./RoomConfigBadge";
import { PlayerList } from "./PlayerList";
import { ReadyButton } from "./ReadyButton";
import type { RoomConfig, ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  code: string;
  config: RoomConfig | null;
  players: ServerPlayer[];
  myId: string | null;
  myReady: boolean;
  onToggleReady: () => void;
};

export function LobbyPanel({ code, config, players, myId, myReady, onToggleReady }: Props) {
  return (
    <section className="relative w-full max-w-5xl">
      <div className="greek-column left-column" aria-hidden />
      <div className="greek-column right-column" aria-hidden />

      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
        <RoomCodeDisplay code={code} />

        {config && (
          <div className="mt-4 flex flex-wrap gap-2">
            <RoomConfigBadge turns={config.turns} pointsPerTurn={config.pointsPerTurn} />
          </div>
        )}

        <PlayerList players={players} myId={myId} className="mt-6" />

        <div className="mt-6">
          <ReadyButton ready={myReady} onToggle={onToggleReady} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Commit**

```bash
git add components/lobby/LobbyPanel.tsx
git commit -m "feat: add LobbyPanel container component"
```

---

## Task 15: Rota /jogo/[code] — LobbyPage e page.tsx

**Files:**
- Create: `app/jogo/[code]/LobbyPage.tsx`
- Create: `app/jogo/[code]/page.tsx`

- [ ] **Criar `app/jogo/[code]/LobbyPage.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import type { ClientMessage, RoomConfig, ServerMessage, ServerPlayer } from "@/lib/lobbyTypes";
import { getLobbySession, clearLobbySession } from "@/lib/sessionLobby";
import { NicknameGate } from "@/components/lobby/NicknameGate";
import { LobbyPanel } from "@/components/lobby/LobbyPanel";

type PlayerInfo = {
  nickname: string;
  isHost: boolean;
  config: RoomConfig | null;
};

type ConnectedProps = {
  code: string;
  playerInfo: PlayerInfo;
};

function LobbyConnected({ code, playerInfo }: ConnectedProps) {
  const [players, setPlayers] = useState<ServerPlayer[]>([]);
  const [config, setConfig] = useState<RoomConfig | null>(playerInfo.config);
  const [myId, setMyId] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const joinSentRef = useRef(false);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: code,
    onOpen() {
      if (joinSentRef.current) return;
      joinSentRef.current = true;
      const msg: ClientMessage = {
        type: "join",
        payload: {
          nickname: playerInfo.nickname,
          isHost: playerInfo.isHost,
          ...(playerInfo.config ? { config: playerInfo.config } : {}),
        },
      };
      socket.send(JSON.stringify(msg));
    },
    onMessage(evt) {
      const msg = JSON.parse(evt.data as string) as ServerMessage;
      if (msg.type === "welcome") {
        setMyId(msg.payload.connectionId);
      } else if (msg.type === "room_update") {
        setPlayers(msg.payload.players);
        if (msg.payload.config) setConfig(msg.payload.config);
      } else if (msg.type === "room_expired") {
        setExpired(true);
      }
    },
  });

  const handleToggleReady = () => {
    const msg: ClientMessage = { type: "toggle_ready" };
    socket.send(JSON.stringify(msg));
  };

  if (expired) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center flex-col gap-4">
        <p className="font-[var(--font-cinzel)] text-xl text-[rgb(239_223_187_/_0.9)]">
          Sala expirada
        </p>
        <p className="text-sm text-[rgb(206_189_156_/_0.7)]">
          Esta sala foi encerrada por inatividade.
        </p>
        <a
          href="/"
          className="mt-2 text-sm font-semibold text-[rgb(214_178_97_/_0.9)] underline underline-offset-4"
        >
          Criar nova sala
        </a>
      </div>
    );
  }

  const myPlayer = players.find((p) => p.id === myId) ?? null;

  return (
    <LobbyPanel
      code={code}
      config={config}
      players={players}
      myId={myId}
      myReady={myPlayer?.ready ?? false}
      onToggleReady={handleToggleReady}
    />
  );
}

export function LobbyPage({ code }: { code: string }) {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);

  useEffect(() => {
    const session = getLobbySession(code);
    if (session) {
      setPlayerInfo(session);
      clearLobbySession(code);
    }
  }, [code]);

  if (!playerInfo) {
    return (
      <NicknameGate
        onSubmit={(nickname) =>
          setPlayerInfo({ nickname, isHost: false, config: null })
        }
      />
    );
  }

  return <LobbyConnected code={code} playerInfo={playerInfo} />;
}
```

- [ ] **Criar `app/jogo/[code]/page.tsx`**

```tsx
import { LobbyPage } from "./LobbyPage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-x-clip">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-7 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
        <LobbyPage code={code} />
      </main>
    </div>
  );
}
```

- [ ] **Verificar TypeScript:**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Commit**

```bash
git add app/jogo/
git commit -m "feat: add /jogo/[code] route with LobbyPage and PartyKit integration"
```

---

## Task 16: Verificação end-to-end

- [ ] **Iniciar os dois servidores em terminais separados:**

Terminal 1 (Next.js):
```bash
npm run dev
```

Terminal 2 (PartyKit):
```bash
npx partykit dev
```

- [ ] **Teste do fluxo completo de host:**

1. Abrir `http://localhost:3000`
2. Preencher nickname (ex.: `Jogador1`), ajustar turnos/pontos
3. Clicar "Iniciar seleção"
4. Verificar redirecionamento para `/jogo/XXXXXX`
5. Verificar que o código aparece na tela em fonte Cinzel
6. Verificar que `Jogador1` aparece na lista com status "Aguardando"
7. Clicar "Pronto" → card deve mudar para verde + `ShieldCheck`
8. Clicar "Cancelar pronto" → volta ao estado aguardando

- [ ] **Teste do fluxo de visitante:**

1. Copiar a URL da sala de espera
2. Abrir em outra aba (ou outro navegador)
3. Verificar que aparece o formulário de nickname (NicknameGate)
4. Preencher nickname (ex.: `Jogador2`) e clicar "Iniciar seleção"
5. Verificar que ambos os jogadores aparecem na lista nas duas abas
6. Verificar que `Jogador2` aparece sem o ícone `Crown`, `Jogador1` aparece com `Crown`
7. Marcar pronto em cada aba e confirmar que o status sincroniza em tempo real

- [ ] **Teste do botão copiar:**

1. Clicar "Copiar link" → verificar feedback "Copiado!" por 2s
2. Colar em nova aba → deve chegar na sala

- [ ] **Commit final se tudo OK:**

```bash
git add .
git commit -m "feat: complete waiting room with real-time PartyKit integration"
```
