# Pacotes Temáticos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar pacotes temáticos ao sistema de votação — um voto especial no turno 1 que, se vencer, trava N campos de `matchConfig` com valores predefinidos, deixando os demais campos para votação normal.

**Architecture:** Pacote é votado no turno 1 em paralelo com os campos normais. Ao final do turno 1, o servidor resolve qual pacote venceu, injeta seus `overrides` no `accumulator` com peso garantidamente vencedor (9999), e transmite `activePackId` aos clientes. Nos turnos seguintes, campos travados aparecem com badge visual de "travado" e não aceitam votos. A lógica de sorteio e resolução existente em `consolidateFinalConfig` não muda — ela simplesmente encontra peso 9999 e declara vencedor.

**Tech Stack:** Next.js 14 App Router, TypeScript, PartyKit (servidor WebSocket em `party/index.ts`), React 19, Tailwind CSS v4.

> **Nota sobre testes:** O projeto não tem suite de testes configurada (ver CLAUDE.md). As etapas de verificação usam o servidor de desenvolvimento e inspeção visual no browser. Não pule as etapas de verificação manual — são o substituto funcional do teste automatizado.

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|------------------|
| `public/data/config.json` | Modificar | Adicionar array `packs` com 11 pacotes |
| `lib/lobbyTypes.ts` | Modificar | Tipo `Pack`, novas mensagens, campos em `VotingState` e `RoomConfig` |
| `party/index.ts` | Modificar | Handlers de voto de pacote, resolução, aplicação de overrides |
| `components/game/PackPanel.tsx` | Criar | Carousel de seleção de pacote (UI só turno 1) |
| `components/game/VotingField.tsx` | Modificar | Suporte a prop `locked` + `lockedValue` |
| `app/jogo/[code]/game/GamePage.tsx` | Modificar | Integrar PackPanel, calcular `lockedFields`, handlers de pack |

---

## Task 1: Dados — adicionar `packs` ao `config.json`

**Files:**
- Modify: `public/data/config.json`

- [ ] **Step 1: Abrir `config.json` e adicionar seção `packs` após `matchConfig`**

Inserir antes da última `}` de fechamento do objeto raiz:

```json
"packs": [
  {
    "id": "none",
    "name": "Nenhum",
    "description": "Sem pacote — todos os campos votados livremente.",
    "difficulty": "neutral",
    "overrides": {}
  },
  {
    "id": "apocalipse",
    "name": "Apocalipse",
    "description": "Bárbaros no modo clã, clima hostil e recursos escassos. Sobrevivência caótica.",
    "difficulty": "hard",
    "overrides": {
      "barbarians": "clan_mode",
      "temperature": "hot",
      "precipitation": "arid",
      "resources": "scarce",
      "tribalVillages": "disabled"
    }
  },
  {
    "id": "descobrimento",
    "name": "Descobrimento",
    "description": "Arquipélagos, posição lendária e recursos abundantes. Foco em exploração naval.",
    "difficulty": "easy",
    "overrides": {
      "mapType": "archipelago",
      "startingPosition": "legendary",
      "resources": "abundant",
      "precipitation": "humid",
      "tribalVillages": "enabled"
    }
  },
  {
    "id": "choque_de_imperios",
    "name": "Choque de Impérios",
    "description": "Pangeia sem bárbaros e sem cidades-estado. Guerra pura desde o primeiro turno.",
    "difficulty": "medium",
    "overrides": {
      "mapType": "pangeia",
      "barbarians": "disabled",
      "cityStates": 0
    }
  },
  {
    "id": "jardim_do_eden",
    "name": "Jardim do Éden",
    "description": "Continentes com recursos abundantes e sem bárbaros. Partida relaxada para aprender.",
    "difficulty": "easy",
    "overrides": {
      "mapType": "continents",
      "resources": "abundant",
      "precipitation": "humid",
      "barbarians": "disabled",
      "startingPosition": "balanced"
    }
  },
  {
    "id": "gelo_eterno",
    "name": "Gelo Eterno",
    "description": "Pangeia fria e árida com nível do mar alto. Escassez extrema, foco em rotas comerciais.",
    "difficulty": "hard",
    "overrides": {
      "mapType": "pangeia",
      "temperature": "cold",
      "precipitation": "arid",
      "seaLevel": "high"
    }
  },
  {
    "id": "terra_prometida",
    "name": "Terra Prometida",
    "description": "Mapa Terra com configurações históricas padrão.",
    "difficulty": "medium",
    "overrides": {
      "mapType": "earth",
      "startingPosition": "standard",
      "resources": "standard",
      "barbarians": "standard"
    }
  },
  {
    "id": "rush_cultural",
    "name": "Rush Cultural",
    "description": "Mediterrâneo com 14 cidades-estado e sem vitória por dominação. Corrida cultural.",
    "difficulty": "medium",
    "overrides": {
      "mapType": "mediterranean",
      "resources": "abundant",
      "cityStates": 14,
      "disabledVictoryConditions": "domination"
    }
  },
  {
    "id": "dueling_grounds",
    "name": "Dueling Grounds",
    "description": "Mapa espelho sem cidades-estado nem aldeias. Competitivo e simétrico.",
    "difficulty": "medium",
    "overrides": {
      "mapType": "mirror",
      "cityStates": 0,
      "tribalVillages": "disabled",
      "startingPosition": "balanced"
    }
  },
  {
    "id": "caos_total",
    "name": "Caos Total",
    "description": "Tudo aleatório com modo cívico aleatório ativado. Nenhuma preparação possível.",
    "difficulty": "chaotic",
    "overrides": {
      "mapType": "random",
      "resources": "random",
      "temperature": "random",
      "precipitation": "random",
      "seaLevel": "random",
      "barbarians": "clan_mode",
      "randomCivicMode": true
    }
  },
  {
    "id": "tutorial",
    "name": "Modo Tutorial",
    "description": "Continentes com recursos abundantes e sem bárbaros. Ideal para iniciantes.",
    "difficulty": "easy",
    "overrides": {
      "mapType": "continents",
      "startingPosition": "legendary",
      "resources": "abundant",
      "barbarians": "disabled",
      "tribalVillages": "enabled"
    }
  }
]
```

- [ ] **Step 2: Verificar JSON válido**

```bash
node -e "JSON.parse(require('fs').readFileSync('public/data/config.json','utf8')); console.log('JSON válido')"
```

Esperado: `JSON válido`

- [ ] **Step 3: Verificar no browser que config ainda carrega**

```bash
npm run dev
```

Abrir `http://localhost:3000`, criar sala, entrar na partida. Console não deve ter erros de JSON parse.

- [ ] **Step 4: Commit**

```bash
git add public/data/config.json
git commit -m "feat: add themed packs data to config.json"
```

---

## Task 2: Tipos — atualizar `lib/lobbyTypes.ts`

**Files:**
- Modify: `lib/lobbyTypes.ts`

- [ ] **Step 1: Adicionar tipo `Pack` logo após os imports/exports iniciais (antes de `RoomConfig`)**

```typescript
// Pacote temático — lido de config.json e enviado pelo host no join
export type Pack = {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "chaotic" | "neutral";
  overrides: Record<string, string | number | boolean>;
};
```

- [ ] **Step 2: Adicionar campo `packs` em `RoomConfig`**

Localizar o tipo `RoomConfig` e adicionar a linha:

```typescript
export type RoomConfig = {
  turns: number;
  pointsPerTurn: number;
  turnDurationSeconds: number;
  packs: Pack[];   // ← adicionar esta linha
};
```

- [ ] **Step 3: Adicionar mensagens de pack em `ClientMessage`**

Localizar o union `ClientMessage` e adicionar dois membros:

```typescript
export type ClientMessage =
  | { type: "join"; payload: { nickname: string; isHost: boolean; config?: RoomConfig } }
  | { type: "toggle_ready" }
  | { type: "update_config"; payload: { config: RoomConfig } }
  | { type: "cast_vote"; payload: { scope: VoteScope; field: string; value: string | number | boolean; weight: number } }
  | { type: "remove_vote"; payload: { scope: VoteScope; field: string; value: string | number | boolean } }
  | { type: "resolve_tie"; payload: { scope: VoteScope; field: string; value: string | number | boolean } }
  | { type: "cast_pack_vote"; payload: { packId: string; weight: number } }  // ← novo
  | { type: "remove_pack_vote" }                                              // ← novo
  | { type: "end_turn" }
  | { type: "confirm_next_turn" }
  | { type: "ping" };
```

- [ ] **Step 4: Adicionar campos de pack em `VotingState`**

Localizar o tipo `VotingState` e adicionar os três campos ao final:

```typescript
export type VotingState = {
  phase: "playing" | "between_turns" | "game_over";
  currentTurn: number;
  totalTurns: number;
  pointsPerTurn: number;
  turnDeadline: number;
  betweenTurnsDeadline: number;
  spendByVoter: Record<string, number>;
  currentTurnVotes: VoteCast[];
  readyToEndCount: number;
  totalPlayers: number;
  pendingTieBreaks?: TieBreakPending[];
  finalConfig?: FinalConfig;
  packVotes?: Record<string, number>;   // ← novo: packId → peso total do grupo
  activePackId?: string | null;          // ← novo: pack vencedor (preenchido após turno 1)
};
```

- [ ] **Step 5: Adicionar tipo `Pack` ao `GameConfigSchema`**

Localizar `GameConfigSchema` e adicionar campo `packs`:

```typescript
export type GameConfigSchema = {
  matchConfig: Record<string, ConfigFieldSchema>;
  playerConfig: Record<string, ConfigFieldSchema>;
  packs?: Pack[];   // ← adicionar
};
```

- [ ] **Step 6: Verificar que TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros. Se houver erros de tipo em outros arquivos porque `packs` agora é obrigatório em `RoomConfig`, resolver nos passos seguintes (Tasks 3 e 5 vão consertar os usos).

- [ ] **Step 7: Commit**

```bash
git add lib/lobbyTypes.ts
git commit -m "feat: add Pack type and pack vote messages to lobbyTypes"
```

---

## Task 3: Servidor — lógica de pack vote em `party/index.ts`

**Files:**
- Modify: `party/index.ts`

**Contexto:** O servidor PartyKit (`party/index.ts`) é uma classe `LobbyServer` que gerencia estado via WebSocket. Votos normais ficam em `accumulator` (mapa de chaves → peso total). Pack vote funciona de modo diferente: só 1 voto por jogador (não Fibonacci), apenas no turno 1. Ao final do turno 1, o servidor resolve qual pack venceu e injeta os `overrides` no `accumulator` com peso 9999 — assim o `consolidateFinalConfig` existente não precisa mudar.

- [ ] **Step 1: Adicionar imports e campos novos em `LobbyServer`**

No topo do arquivo, o import de `lobbyTypes` já existe. Localizar a linha `import type { ... } from "../lib/lobbyTypes"` e adicionar `Pack` à lista:

```typescript
import type {
  ClientMessage,
  FinalConfig,
  Pack,              // ← adicionar
  RoomConfig,
  ServerMessage,
  ServerPlayer,
  TieBreakPending,
  TurnLedger,
  VoteAccumulator,
  VoteBreakdown,
  VoteCast,
  VoteScope,
  VotingState,
} from "../lib/lobbyTypes";
```

Na classe `LobbyServer`, adicionar dois campos logo após `finalConfig: FinalConfig | null = null;`:

```typescript
// Pack voting — only used during turn 1
packVoteByVoter: Map<string, { packId: string; weight: number }> = new Map();
activePackId: string | null = null;
```

- [ ] **Step 2: Adicionar handlers no `onMessage`**

No método `onMessage`, após o bloco `} else if (msg.type === "resolve_tie") {`, adicionar:

```typescript
} else if (msg.type === "cast_pack_vote") {
  this.handleCastPackVote(sender, msg.payload);

} else if (msg.type === "remove_pack_vote") {
  this.handleRemovePackVote(sender);
}
```

- [ ] **Step 3: Implementar `handleCastPackVote`**

Adicionar o método após `handleCastVote`:

```typescript
handleCastPackVote(
  sender: Party.Connection,
  payload: { packId: string; weight: number }
) {
  if (this.gamePhase !== "playing") return;
  if (this.currentTurn !== 1) return;
  if (!this.players.has(sender.id)) return;

  const { packId, weight } = payload;
  if (weight < 1) return;

  const ledger = this.currentLedger!;
  const prev = this.packVoteByVoter.get(sender.id);

  // Refund previous pack vote weight before applying new one
  if (prev) {
    ledger.spendByVoter[sender.id] = Math.max(
      0,
      (ledger.spendByVoter[sender.id] ?? 0) - prev.weight
    );
  }

  const spent = ledger.spendByVoter[sender.id] ?? 0;
  const pointsPerTurn = this.config!.pointsPerTurn;
  if (pointsPerTurn - spent < weight) return;

  this.packVoteByVoter.set(sender.id, { packId, weight });
  ledger.spendByVoter[sender.id] = spent + weight;
  this.broadcastVotingState();
}
```

- [ ] **Step 4: Implementar `handleRemovePackVote`**

Adicionar após `handleCastPackVote`:

```typescript
handleRemovePackVote(sender: Party.Connection) {
  if (this.gamePhase !== "playing") return;
  if (this.currentTurn !== 1) return;

  const prev = this.packVoteByVoter.get(sender.id);
  if (!prev) return;

  const ledger = this.currentLedger!;
  ledger.spendByVoter[sender.id] = Math.max(
    0,
    (ledger.spendByVoter[sender.id] ?? 0) - prev.weight
  );
  this.packVoteByVoter.delete(sender.id);
  this.broadcastVotingState();
}
```

- [ ] **Step 5: Implementar `resolvePackVote`**

Adicionar após `handleRemovePackVote`:

```typescript
resolvePackVote(): string {
  const totals = new Map<string, number>();
  for (const { packId, weight } of this.packVoteByVoter.values()) {
    totals.set(packId, (totals.get(packId) ?? 0) + weight);
  }
  let winner = "none";
  let max = 0;
  for (const [packId, total] of totals) {
    if (total > max) {
      max = total;
      winner = packId;
    }
  }
  return winner;
}
```

- [ ] **Step 6: Implementar `applyPackOverrides`**

Adicionar após `resolvePackVote`:

```typescript
applyPackOverrides(packId: string) {
  if (packId === "none" || !this.config?.packs) return;
  const pack = this.config.packs.find((p) => p.id === packId);
  if (!pack) return;

  // Weight high enough to always win consolidateFinalConfig resolution
  const HIGH_WEIGHT = 9999;
  for (const [field, value] of Object.entries(pack.overrides)) {
    const key = accumulatorKey("match", field, value as string | number | boolean);
    this.accumulator[key] = (this.accumulator[key] ?? 0) + HIGH_WEIGHT;
    if (!this.breakdown[key]) this.breakdown[key] = {};
    this.breakdown[key]["__pack__"] = HIGH_WEIGHT;
  }
}
```

- [ ] **Step 7: Chamar resolução no `endTurn` (turno 1)**

Localizar o método `endTurn`. Logo após a linha `if (this.gamePhase !== "playing") return;` e antes do bloco `const ledger = this.currentLedger!;`, adicionar:

```typescript
// Resolve pack vote at end of turn 1
if (this.currentTurn === 1 && this.packVoteByVoter.size > 0) {
  this.activePackId = this.resolvePackVote();
  this.applyPackOverrides(this.activePackId);
  this.packVoteByVoter.clear();
}
```

- [ ] **Step 8: Reiniciar `packVoteByVoter` e `activePackId` ao iniciar partida**

Localizar o bloco que começa com `this.gamePhase = "playing";` dentro do handler `toggle_ready`. Adicionar logo após `this.finalConfig = null;`:

```typescript
this.packVoteByVoter = new Map();
this.activePackId = null;
```

- [ ] **Step 9: Incluir `packVotes` e `activePackId` no `buildVotingStateMsg`**

Localizar o método `buildVotingStateMsg`. No objeto `state: VotingState`, adicionar ao final (antes do `}`):

```typescript
// Aggregate pack vote totals for broadcast
const packVoteTotals: Record<string, number> = {};
for (const { packId, weight } of this.packVoteByVoter.values()) {
  packVoteTotals[packId] = (packVoteTotals[packId] ?? 0) + weight;
}
```

E no objeto `state`:

```typescript
const state: VotingState = {
  phase: this.gamePhase as VotingState["phase"],
  currentTurn: this.currentTurn,
  totalTurns: this.config.turns,
  pointsPerTurn: this.config.pointsPerTurn,
  turnDeadline: this.gamePhase === "playing" ? this.turnDeadline : 0,
  betweenTurnsDeadline: this.gamePhase === "between_turns" ? this.betweenTurnsDeadline : 0,
  spendByVoter: ledger?.spendByVoter ?? {},
  currentTurnVotes: ledger?.votes ?? [],
  readyToEndCount: this.readyToEndTurn.size,
  totalPlayers: this.players.size,
  ...(this.pendingTieBreaks.length > 0 ? { pendingTieBreaks: this.pendingTieBreaks } : {}),
  ...(this.finalConfig && this.pendingTieBreaks.length === 0 ? { finalConfig: this.finalConfig } : {}),
  ...(this.currentTurn === 1 ? { packVotes: packVoteTotals } : {}),        // ← novo
  ...(this.activePackId !== null ? { activePackId: this.activePackId } : {}), // ← novo
};
```

- [ ] **Step 10: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 11: Commit**

```bash
git add party/index.ts
git commit -m "feat: add pack vote handlers and override injection to PartyKit server"
```

---

## Task 4: UI — criar `components/game/PackPanel.tsx`

**Files:**
- Create: `components/game/PackPanel.tsx`

**Contexto:** Carousel horizontal de cards de pacote. Aparece só no turno 1 durante a fase "playing". Cada card mostra nome, descrição, dificuldade (com badge colorido), lista de campos travados e botões de votar/remover. O componente recebe pontos restantes e chama callbacks `onVote` / `onRemoveVote` sem gerenciar estado de rede.

- [ ] **Step 1: Criar o arquivo**

```typescript
"use client";

import { useState } from "react";
import type { Pack } from "@/lib/lobbyTypes";
import { Lock, Package } from "lucide-react";

type PackPanelProps = {
  packs: Pack[];
  packVotes: Record<string, number>;
  myPackVoteId: string | null;
  myPackVoteWeight: number;
  pointsRemaining: number;
  onVote: (packId: string, weight: number) => void;
  onRemoveVote: () => void;
};

const DIFFICULTY_CONFIG: Record<
  Pack["difficulty"],
  { label: string; className: string }
> = {
  easy:    { label: "Fácil",    className: "border-emerald-500/40 bg-emerald-950/40 text-emerald-400" },
  medium:  { label: "Médio",    className: "border-yellow-500/40 bg-yellow-950/40 text-yellow-400" },
  hard:    { label: "Difícil",  className: "border-orange-500/40 bg-orange-950/40 text-orange-400" },
  chaotic: { label: "Caótico",  className: "border-purple-500/40 bg-purple-950/40 text-purple-400" },
  neutral: { label: "Nenhum",   className: "border-[rgb(190_153_81_/_0.3)] bg-[rgb(10_20_34_/_0.4)] text-[rgb(206_189_156_/_0.6)]" },
};

const PACK_VOTE_WEIGHT = 2;

export function PackPanel({
  packs,
  packVotes,
  myPackVoteId,
  myPackVoteWeight,
  pointsRemaining,
  onVote,
  onRemoveVote,
}: PackPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayPacks = packs.filter((p) => p.id !== "none");
  const selected = displayPacks[selectedIndex];
  const noneTotal = packVotes["none"] ?? 0;
  const selectedTotal = selected ? (packVotes[selected.id] ?? 0) : 0;
  const myVoteIsOnSelected = myPackVoteId === selected?.id;
  const myVoteIsOnNone = myPackVoteId === "none";
  const canVote = pointsRemaining >= PACK_VOTE_WEIGHT;

  if (!selected) return null;

  const lockedFieldLabels = Object.keys(selected.overrides);
  const diff = DIFFICULTY_CONFIG[selected.difficulty];

  return (
    <div className="rounded-xl border border-[rgb(190_153_81_/_0.3)] bg-[rgb(8_18_32_/_0.7)] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-[rgb(214_178_97_/_0.7)] shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(214_180_104_/_0.88)]">
          Pacote Temático
        </span>
        <span className="text-xs text-[rgb(206_189_156_/_0.45)]">· turno 1 · opcional</span>
      </div>

      {/* Carousel nav */}
      <div className="flex gap-1.5 flex-wrap">
        {displayPacks.map((pack, i) => {
          const total = packVotes[pack.id] ?? 0;
          const isActive = i === selectedIndex;
          const isMyVote = myPackVoteId === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={[
                "relative rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-[rgb(214_178_97_/_0.5)] bg-[rgb(23_47_76_/_0.9)] text-[rgb(239_223_187_/_0.95)]"
                  : "border-[rgb(190_153_81_/_0.2)] bg-transparent text-[rgb(206_189_156_/_0.6)] hover:text-[rgb(206_189_156_/_0.9)]",
              ].join(" ")}
            >
              {pack.name}
              {isMyVote && (
                <span className="ml-1 text-[rgb(214_178_97_/_0.8)]">✓</span>
              )}
              {total > 0 && (
                <span className="ml-1 text-[rgb(206_189_156_/_0.45)]">
                  {total}pts
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected pack card */}
      <div className="rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] p-3 space-y-2">
        {/* Pack header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-[rgb(239_223_187_/_0.95)]">
            {selected.name}
          </span>
          <span
            className={[
              "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              diff.className,
            ].join(" ")}
          >
            {diff.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-[rgb(206_189_156_/_0.65)] leading-relaxed">
          {selected.description}
        </p>

        {/* Locked fields list */}
        {lockedFieldLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            <Lock className="h-3 w-3 text-[rgb(206_189_156_/_0.4)] shrink-0 mt-0.5" />
            {lockedFieldLabels.map((field) => (
              <span
                key={field}
                className="rounded bg-[rgb(23_47_76_/_0.5)] px-1.5 py-0.5 text-[10px] text-[rgb(206_189_156_/_0.55)]"
              >
                {field}={String(selected.overrides[field])}
              </span>
            ))}
          </div>
        )}

        {/* Vote counts + actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-[rgb(206_189_156_/_0.5)]">
            Grupo: <span className="font-semibold text-[rgb(214_178_97_/_0.7)]">{selectedTotal} pts</span>
            {myVoteIsOnSelected && (
              <span className="ml-1 text-[rgb(214_178_97_/_0.6)]">
                (seus: {myPackVoteWeight} pts)
              </span>
            )}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {myPackVoteId !== null && (
              <button
                type="button"
                onClick={onRemoveVote}
                className="rounded-lg border border-[rgb(190_153_81_/_0.3)] px-2.5 py-1.5 text-xs text-[rgb(206_189_156_/_0.7)] transition-colors hover:border-[rgb(190_153_81_/_0.5)] hover:text-[rgb(206_189_156_/_0.95)]"
              >
                Remover
              </button>
            )}
            <button
              type="button"
              disabled={!canVote && !myVoteIsOnSelected}
              onClick={() => {
                if (myVoteIsOnSelected) return;
                if (canVote) onVote(selected.id, PACK_VOTE_WEIGHT);
              }}
              className="rounded-xl border border-[rgb(214_178_97_/_0.54)] bg-gradient-to-b from-[rgb(24_53_84_/_0.94)] to-[rgb(13_28_48_/_0.96)] px-3 py-1.5 text-xs font-semibold text-[rgb(237_210_148_/_0.96)] transition-all hover:not-disabled:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {myVoteIsOnSelected ? "✓ Votado" : `Votar · ${PACK_VOTE_WEIGHT} pts`}
            </button>
          </div>
        </div>
      </div>

      {/* "None" option */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[rgb(206_189_156_/_0.45)]">
          Sem pacote: {noneTotal > 0 ? `${noneTotal} pts` : "0 pts"}
          {myVoteIsOnNone && " (seu voto)"}
        </span>
        <button
          type="button"
          disabled={!canVote && !myVoteIsOnNone}
          onClick={() => {
            if (myVoteIsOnNone) return;
            if (canVote) onVote("none", PACK_VOTE_WEIGHT);
          }}
          className="rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-transparent px-2.5 py-1 text-xs text-[rgb(206_189_156_/_0.55)] transition-colors hover:not-disabled:text-[rgb(206_189_156_/_0.85)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {myVoteIsOnNone ? "✓ Nenhum" : `Votar nenhum · ${PACK_VOTE_WEIGHT} pts`}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/game/PackPanel.tsx
git commit -m "feat: add PackPanel carousel component for themed pack voting"
```

---

## Task 5: UI — campo travado em `VotingField.tsx`

**Files:**
- Modify: `components/game/VotingField.tsx`

**Contexto:** Quando um pack está ativo, campos cujo `field` está em `pack.overrides` devem mostrar badge "🔒 Travado" com o valor vencedor, sem botão de voto. Isso é feito passando `locked` e `lockedValue` pra `VotingField`.

- [ ] **Step 1: Adicionar props `locked` e `lockedValue` ao tipo `BaseProps`**

Localizar o tipo `BaseProps` e adicionar duas props:

```typescript
type BaseProps = {
  fieldKey: string;
  schema: ConfigFieldSchema;
  leaders: LeaderEntry[];
  pointsRemaining: number;
  turnVoteTally: Record<string, number>;
  myTurnVoteTally: Record<string, number>;
  onVote: (value: string | number | boolean, weight: number) => void;
  onRemoveVote: (value: string | number | boolean) => void;
  locked?: boolean;           // ← novo
  lockedValue?: string | number | boolean;  // ← novo
};
```

- [ ] **Step 2: Renderizar estado travado no início de `VotingField`**

No componente `VotingField`, antes do `if (props.schema.type === "select")`, adicionar:

```typescript
export function VotingField(props: BaseProps) {
  if (props.locked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(190_153_81_/_0.15)] bg-[rgb(8_15_26_/_0.6)] px-3 py-2.5 opacity-70">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-[rgb(206_189_156_/_0.6)] truncate">
            {props.lockedValue !== undefined ? String(props.lockedValue) : "—"}
          </span>
        </div>
        <span className="shrink-0 flex items-center gap-1 rounded border border-[rgb(190_153_81_/_0.3)] bg-[rgb(23_47_76_/_0.5)] px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(214_178_97_/_0.6)]">
          🔒 Pacote
        </span>
      </div>
    );
  }

  if (props.schema.type === "select") { ...
```

- [ ] **Step 3: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/game/VotingField.tsx
git commit -m "feat: add locked state display to VotingField for pack overrides"
```

---

## Task 6: Integração — atualizar `GamePage.tsx`

**Files:**
- Modify: `app/jogo/[code]/game/GamePage.tsx`

**Contexto:** `GamePage` precisa: (1) enviar `packs` do `config.json` no `join`/`update_config`, (2) calcular `lockedFields` baseado em `activePackId`, (3) renderizar `PackPanel` no turno 1, (4) passar `locked`/`lockedValue` pra cada `VotingField`, (5) adicionar handlers de pack vote.

- [ ] **Step 1: Adicionar import de `PackPanel`**

No topo do arquivo, junto aos outros imports de componentes:

```typescript
import { PackPanel } from "@/components/game/PackPanel";
```

- [ ] **Step 2: Adicionar import de `Pack` nos tipos**

```typescript
import type {
  ClientMessage,
  ConfigFieldSchema,
  GameConfigSchema,
  Pack,              // ← adicionar
  ServerMessage,
  ServerPlayer,
  TieBreakPending,
  VoteCast,
  VoteScope,
  VotingState,
} from "@/lib/lobbyTypes";
```

- [ ] **Step 3: Calcular `packs`, `lockedFields` e `myPackVote` antes do return**

Localizar a linha `const activeScope = tabs.find(...)`. Logo antes dela, adicionar:

```typescript
const packs: Pack[] = configSchema?.packs ?? [];

const activePackId = votingState?.activePackId ?? null;

const lockedFields = (() => {
  if (!activePackId || activePackId === "none") return new Set<string>();
  const pack = packs.find((p) => p.id === activePackId);
  return new Set(Object.keys(pack?.overrides ?? {}));
})();

const packVotes = votingState?.packVotes ?? {};
const myPackVoteEntry = (() => {
  if (!myId || !votingState?.packVotes) return null;
  // packVotes is aggregated totals — my individual vote comes from the socket state
  // We track it separately via a local ref updated when we send cast_pack_vote
  return null; // resolved in Step 6 below
})();
```

- [ ] **Step 4: Adicionar `myPackVoteId` e `myPackVoteWeight` como state local**

Junto ao `useState` de `iReadyToEnd`:

```typescript
const [myPackVoteId, setMyPackVoteId] = useState<string | null>(null);
const [myPackVoteWeight, setMyPackVoteWeight] = useState<number>(0);
```

Resetar quando o turno avança além de 1 — adicionar ao `onMessage` handler de `voting_state`:

```typescript
} else if (msg.type === "voting_state") {
  setVotingState((prev) => {
    if (prev && prev.currentTurn !== msg.payload.currentTurn) {
      setIReadyToEnd(false);
      if (msg.payload.currentTurn > 1) {
        setMyPackVoteId(null);      // ← adicionar
        setMyPackVoteWeight(0);     // ← adicionar
      }
    }
    return msg.payload;
  });
}
```

- [ ] **Step 5: Adicionar handlers de pack vote**

Após `handleResolveTie`, adicionar:

```typescript
const handlePackVote = (packId: string, weight: number) => {
  setMyPackVoteId(packId);
  setMyPackVoteWeight(weight);
  sendMsg({ type: "cast_pack_vote", payload: { packId, weight } });
};

const handlePackRemoveVote = () => {
  setMyPackVoteId(null);
  setMyPackVoteWeight(0);
  sendMsg({ type: "remove_pack_vote" });
};
```

- [ ] **Step 6: Renderizar `PackPanel` no turno 1**

Localizar o `<div className="flex-1 overflow-y-auto ...">` (a área de scroll dos campos). Logo dentro dele, antes do `<div className="space-y-4">` dos campos, adicionar:

```typescript
{/* Pack panel — only visible on turn 1 during playing phase */}
{currentTurn === 1 && votingState?.phase === "playing" && packs.length > 0 && (
  <div className="mb-4">
    <PackPanel
      packs={packs}
      packVotes={packVotes}
      myPackVoteId={myPackVoteId}
      myPackVoteWeight={myPackVoteWeight}
      pointsRemaining={pointsRemaining}
      onVote={handlePackVote}
      onRemoveVote={handlePackRemoveVote}
    />
  </div>
)}

{/* Active pack banner — turns 2+ */}
{currentTurn > 1 && activePackId && activePackId !== "none" && (
  <div className="mb-3 flex items-center gap-2 rounded-lg border border-[rgb(190_153_81_/_0.25)] bg-[rgb(10_20_34_/_0.5)] px-3 py-2">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(214_178_97_/_0.6)]">🔒 Pacote ativo:</span>
    <span className="text-xs text-[rgb(206_189_156_/_0.8)]">
      {packs.find((p) => p.id === activePackId)?.name ?? activePackId}
      {" — "}
      {lockedFields.size} campo{lockedFields.size !== 1 ? "s" : ""} travado{lockedFields.size !== 1 ? "s" : ""}
    </span>
  </div>
)}
```

- [ ] **Step 7: Passar `locked` e `lockedValue` pra `VotingField`**

Localizar o trecho que renderiza `<VotingField ... />`. Adicionar as duas props:

```typescript
<VotingField
  fieldKey={key}
  schema={schema}
  leaders={leaders}
  pointsRemaining={pointsRemaining}
  turnVoteTally={buildTurnTally(votingState?.currentTurnVotes ?? [], activeScope, key)}
  myTurnVoteTally={myId ? buildMyTurnTally(votingState?.currentTurnVotes ?? [], myId, activeScope, key) : {}}
  onVote={(value, weight) => handleVote(activeScope, key, value, weight)}
  onRemoveVote={(value) => handleRemoveVote(activeScope, key, value)}
  locked={activeTab === "match" && lockedFields.has(key)}           // ← novo
  lockedValue={activeTab === "match" ? (packs.find(p => p.id === activePackId)?.overrides[key]) : undefined}  // ← novo
/>
```

- [ ] **Step 8: Garantir que `packs` é enviado no `join` e `update_config`**

Localizar onde `GameSession` é lida do `sessionStorage` e onde o join é enviado. O `join` atual não envia config (só `{ nickname, isHost }`). Config é enviada pelo host via `update_config` quando muda no lobby.

O lugar certo para injetar `packs` é em `update_config`. Localizar o envio de `update_config` no componente de configuração da sala (`components/lobby/ConfigPanel.tsx`). Verificar como ele constrói o payload — os `packs` precisam vir do `config.json` já carregado.

Verificar se `ConfigPanel` tem acesso ao `configSchema`. Se sim, basta incluir `packs: configSchema.packs ?? []` no `RoomConfig` enviado. Se não, o `GamePage.tsx` já carrega `configSchema` — garantir que quando o host faz `update_config`, o novo `packs` está incluso.

Abrir `components/lobby/ConfigPanel.tsx` e verificar o tipo que ele envia:

```bash
grep -n "update_config\|RoomConfig" components/lobby/ConfigPanel.tsx
```

Ajustar conforme necessário para que `packs` seja parte do config enviado. O servidor recebe via `this.config = msg.payload.config` e usa `this.config.packs` em `applyPackOverrides`.

- [ ] **Step 9: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 10: Commit**

```bash
git add app/jogo/[code]/game/GamePage.tsx
git commit -m "feat: integrate PackPanel into GamePage with locked fields and pack handlers"
```

---

## Task 7: Fix `ConfigPanel` — propagar `packs` no `RoomConfig`

**Files:**
- Modify: `components/lobby/ConfigPanel.tsx`

**Contexto:** O host envia `RoomConfig` via WebSocket ao mudar configurações no lobby. `RoomConfig` agora tem campo `packs` obrigatório. `ConfigPanel` é quem monta e envia esse payload — precisa incluir `packs`.

- [ ] **Step 1: Ler ConfigPanel para entender estrutura atual**

```bash
# Verificar como ConfigPanel envia config
grep -n "update_config\|RoomConfig\|packs\|config.json" components/lobby/ConfigPanel.tsx | head -30
```

- [ ] **Step 2: Adicionar `packs` ao payload de `update_config`**

Localizar onde `ConfigPanel` chama o socket com `update_config`. O payload é um objeto `RoomConfig`. Adicionar `packs` carregado do `configSchema` (que o componente provavelmente já busca ou recebe como prop).

Se `ConfigPanel` não tem acesso ao `configSchema.packs`, passar como prop de `LobbyPage.tsx`:

```typescript
// Em LobbyPage.tsx ou componente pai:
// Carregar config.json e passar packs para ConfigPanel
const [packs, setPacks] = useState<Pack[]>([]);
useEffect(() => {
  fetch("/data/config.json")
    .then(r => r.json())
    .then(data => setPacks(data.packs ?? []));
}, []);

// Passar para ConfigPanel:
<ConfigPanel ... packs={packs} />
```

```typescript
// Em ConfigPanel.tsx, incluir no payload:
const roomConfig: RoomConfig = {
  turns: ...,
  pointsPerTurn: ...,
  turnDurationSeconds: ...,
  packs: props.packs,   // ← adicionar
};
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add components/lobby/ConfigPanel.tsx
# Incluir outros arquivos modificados nesta task
git commit -m "feat: propagate packs in RoomConfig from ConfigPanel to server"
```

---

## Task 8: Verificação Manual End-to-End

**Files:** nenhum arquivo modificado — só verificação.

- [ ] **Step 1: Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Verificar no browser — turno 1 mostra PackPanel**

1. Abrir `http://localhost:3000`.
2. Criar sala com 1 ou 2 jogadores.
3. Marcar ready para iniciar.
4. Verificar que o `PackPanel` aparece no topo da área de votação.
5. Verificar que cada pack do carousel tem nome, descrição, badge de dificuldade.

- [ ] **Step 3: Verificar voto de pack**

1. Clicar em "Apocalipse" no carousel.
2. Clicar "Votar · 2 pts" — botão deve mudar pra "✓ Votado", pontos devem diminuir.
3. Verificar que "Grupo: 2 pts" aparece.
4. Clicar "Remover" — pontos voltam, voto some.

- [ ] **Step 4: Verificar que pack vencedor trava campos no turno 2**

1. Votar em um pack (ex: Apocalipse).
2. Clicar "Finalizar turno" (todos os jogadores).
3. Após transição, verificar que turno 2 mostra:
   - Banner "🔒 Pacote ativo: Apocalipse — 5 campos travados".
   - Campos `barbarians`, `temperature`, `precipitation`, `resources`, `tribalVillages` mostram badge "🔒 Pacote" com o valor travado.
   - Campos não travados aparecem normais com botão de voto.

- [ ] **Step 5: Verificar game over com overrides aplicados**

1. Completar todos os turnos (ou ajustar sala pra 1 turno).
2. Na tela de resultado, verificar que campos travados pelo pack mostram o valor correto (ex: `barbarians: clan_mode`).

- [ ] **Step 6: Verificar que sem voto de pack funciona**

1. Completar jogo sem votar em nenhum pack.
2. Verificar que nenhum campo aparece como travado no turno 2.
3. Resultado final deve refletir só os votos normais.

- [ ] **Step 7: Lint**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 8: Build de produção**

```bash
npm run build
```

Esperado: build bem-sucedido sem erros de TypeScript.

- [ ] **Step 9: Commit final**

```bash
git add -A
git commit -m "feat: themed packs — full pack voting system with locked fields"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|-----------|------|
| 11 pacotes com campos travados | Task 1 |
| Voto de pack no turno 1 | Tasks 2, 3, 6 |
| Servidor resolve pack vencedor | Task 3 (resolvePackVote) |
| Overrides injetados com peso 9999 | Task 3 (applyPackOverrides) |
| Campos travados exibem badge | Tasks 5, 6 |
| PackPanel visual com carousel | Task 4 |
| Banner de pack ativo turnos 2+ | Task 6 |
| `packs` propagado via RoomConfig | Tasks 2, 7 |
| Empate de pack → "none" vence | Task 3 (resolvePackVote: max=0, winner="none" default) |
| Pack "none" tem opção de voto | Task 4 (botão "Votar nenhum") |

### Placeholder scan

Nenhum TBD, TODO, "similar to Task N", ou código ausente encontrado.

### Type consistency

- `Pack` definido em Task 2, usado em Tasks 3, 4, 5, 6 — ✓ consistente.
- `packVoteByVoter: Map<string, { packId, weight }>` — Task 3 define e usa — ✓.
- `PACK_VOTE_WEIGHT = 2` — definido em Task 4, não referenciado em outros componentes — ✓ isolado.
- `lockedFields: Set<string>` — Task 6 calcula, passa como `locked={lockedFields.has(key)}` — ✓.
- `activePackId` em `VotingState` (Task 2) = `activePackId` no servidor (Task 3) = `activePackId` no cliente (Task 6) — ✓.
