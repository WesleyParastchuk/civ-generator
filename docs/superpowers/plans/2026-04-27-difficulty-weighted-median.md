# Difficulty Weighted-Median Resolution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plurality voting for the `difficulty` field with weighted-average resolution so that votes on extreme ends produce an intermediate difficulty instead of a tie.

**Architecture:** Pure server-side change in `party/index.ts`. Add a `DIFFICULTY_ORDER` constant and a `resolveOrderedField` method, then branch inside `resolveField` when `field === "difficulty"`. Zero client changes required.

**Tech Stack:** TypeScript, PartyKit server (`partykit/server`)

---

## File Map

| File | Change |
|------|--------|
| `party/index.ts` | Add constant + method + branch in `resolveField` |

---

### Task 1: Add `DIFFICULTY_ORDER` constant

**Files:**
- Modify: `party/index.ts`

- [ ] **Step 1: Add constant after the existing top-level constants**

In `party/index.ts`, after line 18 (`const BETWEEN_TURNS_MS = 5000;`), add:

```typescript
const DIFFICULTY_ORDER = [
  "settler",
  "chieftain",
  "warlord",
  "prince",
  "king",
  "emperor",
  "immortal",
  "deity",
] as const;
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add party/index.ts
git commit -m "feat: add DIFFICULTY_ORDER constant for weighted-median resolution"
```

---

### Task 2: Add `resolveOrderedField` method

**Files:**
- Modify: `party/index.ts`

- [ ] **Step 1: Add method to `LobbyServer` class**

Add the following method directly above the existing `resolveField` method (around line 387):

```typescript
resolveOrderedField(
  scope: VoteScope,
  field: string,
  order: readonly string[],
): {
  winner: string | number | boolean | null;
  tied: boolean;
  tiedValues: Array<string | number | boolean>;
  maxWeight: number;
} {
  const prefix = `${scopeKey(scope)}|${field}|`;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [idx, val] of order.entries()) {
    const key = `${prefix}${val}`;
    const w = this.accumulator[key] ?? 0;
    weightedSum += idx * w;
    totalWeight += w;
  }
  if (totalWeight === 0) {
    return { winner: null, tied: true, tiedValues: [], maxWeight: 0 };
  }
  const avgIdx = Math.round(weightedSum / totalWeight);
  return { winner: order[avgIdx], tied: false, tiedValues: [], maxWeight: totalWeight };
}
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add party/index.ts
git commit -m "feat: add resolveOrderedField method for weighted-average resolution"
```

---

### Task 3: Branch in `resolveField` for difficulty

**Files:**
- Modify: `party/index.ts`

- [ ] **Step 1: Add branch at the top of `resolveField`**

Find the `resolveField` method. It currently starts with:

```typescript
resolveField(
  scope: VoteScope,
  field: string
): {
  winner: string | number | boolean | null;
  tied: boolean;
  tiedValues: Array<string | number | boolean>;
  maxWeight: number;
} {
  const prefix = `${scopeKey(scope)}|${field}|`;
```

Add a guard before `const prefix = ...`:

```typescript
resolveField(
  scope: VoteScope,
  field: string
): {
  winner: string | number | boolean | null;
  tied: boolean;
  tiedValues: Array<string | number | boolean>;
  maxWeight: number;
} {
  if (field === "difficulty") {
    return this.resolveOrderedField(scope, field, DIFFICULTY_ORDER);
  }
  const prefix = `${scopeKey(scope)}|${field}|`;
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add party/index.ts
git commit -m "feat: route difficulty field through weighted-median resolution"
```

---

### Task 4: Manual verification

No test suite exists yet. Verify behavior manually with the dev server.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test case — votos extremos**

1. Abrir duas abas como dois jogadores em uma sala
2. Ambos clicam em Ready para iniciar o jogo
3. Jogador 1: gastar pontos em "Colono" para o jogador-alvo
4. Jogador 2: gastar pontos em "Divindade" para o mesmo jogador-alvo (mesma quantidade que jogador 1)
5. Ambos clicam "Finalizar turno" em todos os turnos sem votar mais
6. Na tela final, verificar que a dificuldade do jogador é **Rei** (índice 4), não um empate

- [ ] **Step 3: Test case — consenso preservado**

1. Nova sala, mesma configuração
2. Ambos jogadores votam em "Divindade" para o mesmo jogador
3. Verificar que a dificuldade final é **Divindade** (pluralidade preservada quando há consenso)

- [ ] **Step 4: Test case — sem votos**

1. Nova sala
2. Ninguém vota em dificuldade
3. Verificar que a tela final **não** mostra dificuldade resolvida para aquele jogador (ou mostra tie-break pendente para o host)

---

## Self-Review

**Spec coverage:**
- ✅ Média ponderada de índice → Task 2
- ✅ Hardcode apenas `difficulty` → Tasks 1 + 3
- ✅ Sem votos → host desempata (retorna `tied: true`) → Task 2, `totalWeight === 0` branch
- ✅ Math.round → Task 2, `Math.round(weightedSum / totalWeight)`
- ✅ Outros campos inalterados → Task 3 (branch só entra em `difficulty`)

**Placeholder scan:** Nenhum TBD ou TODO presente.

**Type consistency:** `resolveOrderedField` retorna o mesmo shape que `resolveField` — compatível com todos os call sites em `consolidateFinalConfig`.
