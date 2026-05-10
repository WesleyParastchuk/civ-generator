# Balance Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reweight voting costs in `public/data/config.json` to align with Civilization VI impact, plus add per-leader tier-based pricing for `civilization` and `bannedCivilizations` selects.

**Architecture:** Three phases. Phase 1 = pure data edits (config.json) for urgent griefing/imbalance fixes. Phase 2 = data edits for medium-priority symmetry/scale fixes. Phase 3 = adds tier metadata to `leaders.json` and threads it through `VotingField.tsx::buildSelectOptions` so leader-based selects price by tier instead of flat 1pt.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19. No test suite — verification via `npm run lint` + manual smoke test (`npm run dev` then load `/jogo/<code>/game`).

**Reference:** `docs/balance-review.md` (analysis source).

---

## File Structure

**Modified:**
- `public/data/config.json` — reweight options across multiple fields (Phases 1+2); maybe add per-field metadata for leader weights (Phase 3).
- `public/data/leaders.json` — add `tier` field per leader (Phase 3).
- `lib/lobbyTypes.ts` — extend `SelectFieldSchema` and/or `LeaderEntry`-related typing if Phase 3 needs new fields.
- `components/game/VotingField.tsx` — `buildSelectOptions` reads tier from leader entry to set per-option weight (Phase 3).

**No new files.** All work is in existing data + one component.

---

## Phase 1 — Critical reweights (data only)

### Task 1: Bump `bannedCivilizations` to flat 3pt minimum

**Files:**
- Modify: `public/data/config.json` (`matchConfig.bannedCivilizations`)

Currently leader-sourced selects use weight=1 from `buildSelectOptions` in `components/game/VotingField.tsx:309` (hardcoded `weight: 1`). Phase 3 will make it tier-aware. For now, lift the floor by introducing a `baseWeight` field consumed in Phase 3, but as **interim** fix in this task simply raise the cost for *all* leaders by editing `buildSelectOptions` to use a per-field `baseWeight` from schema with default 1, **scoped only via Phase 3**.

**This task is a pure config addition** — no behavior change yet. Adds the field that Phase 3 will consume.

- [ ] **Step 1: Add `baseWeight: 3` to bannedCivilizations schema**

Edit `public/data/config.json`. Locate `matchConfig.bannedCivilizations` (around line 179-187). After the `excludeLeaderIds` line, insert `"baseWeight": 3,`:

```json
    "bannedCivilizations": {
      "label": "Banir civilização",
      "type": "select",
      "description": "Votação para banir um líder (convertido de multiselect)",
      "default": null,
      "leadersSource": "leaders.json",
      "excludeLeaderIds": [1],
      "baseWeight": 3,
      "note": "Use os IDs (1-22) dos líderes de leaders.json para nomear as opções"
    }
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: PASS, no new errors.

- [ ] **Step 3: Commit**

```bash
git add public/data/config.json
git commit -m "balance: add baseWeight=3 to bannedCivilizations schema"
```

> Note: `baseWeight` is dormant data until Task 11 wires it into `buildSelectOptions`. Safe to ship now — extra JSON keys are ignored by current parser.

---

### Task 2: Reweight `disabledVictoryConditions` by impact tier

**Files:**
- Modify: `public/data/config.json` (`matchConfig.disabledVictoryConditions.options`)

Tiers: Domination/Science/Culture (core paths) = 3pt, Religious = 2pt, Score = 1pt.

- [ ] **Step 1: Edit option weights**

Replace the entire `options` array of `disabledVictoryConditions` with:

```json
      "options": [
        { "value": "science", "label": "Científica", "weight": 3 },
        { "value": "cultural", "label": "Cultural", "weight": 3 },
        { "value": "domination", "label": "Dominação", "weight": 3 },
        { "value": "score", "label": "Pontuação", "weight": 1 },
        { "value": "religious", "label": "Religiosa", "weight": 2 }
      ]
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Smoke test in UI**

Run: `npm run dev`. Open new room, start game. In the voting UI for "Desativar condição de vitória", confirm dropdown shows weights `3 pts` for Científica/Cultural/Dominação, `2 pts` for Religiosa, `1 pt` for Pontuação.

- [ ] **Step 4: Commit**

```bash
git add public/data/config.json
git commit -m "balance: tier disabledVictoryConditions weights by impact"
```

---

### Task 3: Reweight `startingPosition` (Legendary expensive)

**Files:**
- Modify: `public/data/config.json` (`matchConfig.startingPosition.options`)

Legendary = enormous opening advantage in Civ VI (rivers + hills + bonus resources). Move to 3pt.

- [ ] **Step 1: Edit option weights**

Replace the `options` array of `startingPosition`:

```json
      "options": [
        { "value": "balanced", "label": "Balanceada", "weight": 1, "default": true },
        { "value": "standard", "label": "Padrão", "weight": 1 },
        { "value": "legendary", "label": "Lendária", "weight": 3 }
      ]
```

- [ ] **Step 2: Verify lint + smoke**

Run: `npm run lint` (PASS). Then `npm run dev` and confirm the field shows `3 pts` for Lendária.

- [ ] **Step 3: Commit**

```bash
git add public/data/config.json
git commit -m "balance: raise legendary startingPosition to 3pt"
```

---

### Task 4: Raise `maxCities: same_as_others` cost

**Files:**
- Modify: `public/data/config.json` (`playerConfig.maxCities.options`)

House-rule with massive anti-snowball impact; current 2pt trivial.

- [ ] **Step 1: Edit option weights**

Replace `options` of `maxCities`:

```json
      "options": [
        { "value": "unlimited", "label": "Sem limite", "weight": 1, "default": true },
        { "value": "same_as_others", "label": "Mesma quantidade dos outros jogadores", "weight": 5 }
      ]
```

- [ ] **Step 2: Verify lint + smoke**

Run: `npm run lint` (PASS). `npm run dev`, confirm UI shows `5 pts` on the second option.

- [ ] **Step 3: Commit**

```bash
git add public/data/config.json
git commit -m "balance: raise maxCities same_as_others to 5pt"
```

---

## Phase 2 — Symmetry & defaults (data only)

### Task 5: Rewrite `difficulty` weights as symmetric step-based

**Files:**
- Modify: `public/data/config.json` (`playerConfig.difficulty.options`)

Default = `prince`. Each step away costs more. Settler/Immortal symmetric (3 steps) → 3pt; Deity = 5pt (4 steps + AI bonuses).

- [ ] **Step 1: Edit option weights**

Replace `options` of `difficulty`:

```json
      "options": [
        { "value": "settler", "label": "Colono", "weight": 3 },
        { "value": "chieftain", "label": "Chefe", "weight": 2 },
        { "value": "warlord", "label": "Senhor da guerra", "weight": 1 },
        { "value": "prince", "label": "Príncipe", "weight": 1 },
        { "value": "king", "label": "Rei", "weight": 1 },
        { "value": "emperor", "label": "Imperador", "weight": 2 },
        { "value": "immortal", "label": "Imortal", "weight": 3 },
        { "value": "deity", "label": "Divindade", "weight": 5 }
      ]
```

- [ ] **Step 2: Verify lint + smoke**

Run: `npm run lint` (PASS). `npm run dev`, confirm dropdown weights match.

- [ ] **Step 3: Commit**

```bash
git add public/data/config.json
git commit -m "balance: symmetric step-based difficulty weights"
```

---

### Task 6: Equalize `barbarians: clan_mode` with `disabled`

**Files:**
- Modify: `public/data/config.json` (`matchConfig.barbarians.options`)

Both deviate strongly from standard; bump clan_mode to 3pt for parity.

- [ ] **Step 1: Edit option weights**

Replace `options` of `barbarians`:

```json
      "options": [
        { "value": "disabled", "label": "Sem bárbaros", "weight": 3 },
        { "value": "standard", "label": "Com bárbaros", "weight": 1, "default": true },
        { "value": "clan_mode", "label": "Modo clã bárbaros", "weight": 3 }
      ]
```

- [ ] **Step 2: Lint + smoke + commit**

```bash
npm run lint
git add public/data/config.json
git commit -m "balance: clan_mode barbarians match disabled cost (3pt)"
```

---

### Task 7: Lower `tribalVillages: disabled` to 2pt

**Files:**
- Modify: `public/data/config.json` (`matchConfig.tribalVillages.options`)

Villages = small/medium impact; 3pt overpriced.

- [ ] **Step 1: Edit option weights**

Replace `options` of `tribalVillages`:

```json
      "options": [
        { "value": "disabled", "label": "Sem aldeias", "weight": 2 },
        { "value": "enabled", "label": "Com aldeias", "weight": 1, "default": true }
      ]
```

- [ ] **Step 2: Lint + smoke + commit**

```bash
npm run lint
git add public/data/config.json
git commit -m "balance: lower tribalVillages disabled to 2pt"
```

---

### Task 8: Symmetrize `seaLevel`

**Files:**
- Modify: `public/data/config.json` (`matchConfig.seaLevel.options`)

`high` and `low` deviate equally from `standard`; both should be 1pt. Random stays 2pt.

- [ ] **Step 1: Edit option weights**

Replace `options` of `seaLevel`:

```json
      "options": [
        { "value": "low", "label": "Baixo", "weight": 1 },
        { "value": "standard", "label": "Padrão", "weight": 1, "default": true },
        { "value": "high", "label": "Alto", "weight": 1 },
        { "value": "random", "label": "Aleatório", "weight": 2 }
      ]
```

- [ ] **Step 2: Lint + smoke + commit**

```bash
npm run lint
git add public/data/config.json
git commit -m "balance: symmetric seaLevel weights (low=high=1pt)"
```

---

### Task 9: Bump `cityStates` default from 9 → 11

**Files:**
- Modify: `public/data/config.json` (`matchConfig.cityStates.default`)

Civ VI standard map = 12 CS. Default 11 closer to vanilla; 9 was outlier.

- [ ] **Step 1: Change default**

In the `cityStates` block, change `"default": 9,` to `"default": 11,`. Block becomes:

```json
    "cityStates": {
      "label": "Cidades-estados",
      "type": "range",
      "min": 0,
      "max": 14,
      "default": 11,
      "unit": "cidades"
    }
```

- [ ] **Step 2: Verify Fibonacci range still resolves**

Open `components/game/VotingField.tsx:227` `RangeVoteField`. Check that it uses `defaultVal` from schema for the initial `selected` state and Fibonacci distance. Confirm visually in `npm run dev`.

- [ ] **Step 3: Commit**

```bash
git add public/data/config.json
git commit -m "balance: cityStates default 9 -> 11 to match Civ VI standard"
```

---

### Task 10: Clarify `maxIdleTurns` description

**Files:**
- Modify: `public/data/config.json` (`playerConfig.maxIdleTurns.description`)

Current description ambiguous. Replace.

- [ ] **Step 1: Edit description**

In `maxIdleTurns` block, change `description` to:

```json
      "description": "Quantidade máxima de turnos consecutivos sem ações antes do jogador ser considerado AFK e pular o turno"
```

(If current behavior differs, adjust copy to match actual rule. If unsure, mark TODO in code review and ship after host confirms.)

- [ ] **Step 2: Lint + commit**

```bash
npm run lint
git add public/data/config.json
git commit -m "balance: clarify maxIdleTurns description"
```

---

## Phase 3 — Per-leader tier pricing

### Task 11: Add `tier` field to `leaders.json`

**Files:**
- Modify: `public/data/leaders.json`

Tier scale: `S` (top, expensive ban / cheap pick? — design decision below), `A`, `B`, `C` (weakest).

**Design rule used here:** voting *for* a civ uses tier as cost (S = 5pt, A = 3pt, B = 2pt, C = 1pt — higher tier costs more to "claim"). Voting *to ban* a civ inverts via `baseWeight` (Task 1) acting as floor; final ban cost = max(baseWeight, tier-cost). For simplicity in this plan, both `civilization` and `bannedCivilizations` selects use the same per-leader tier weight, with `bannedCivilizations` floored at its `baseWeight=3`.

Tier list (community consensus, base game leaders only — adjust if you disagree):
- **S**: Gilgamesh (9), Pedro/Russia (16), Tomyris (21)
- **A**: Filipe II (6), Frederick (7), Hojo (12), Saladino (19), Pericles (17)
- **B**: Catarina (3), Pedro II/Brasil (4), Gandhi (8), Gorgo (10), Harald (11), Júlio César (13), Mvemba (15), Qin (18), Vitória (22)
- **C**: Cleópatra (5), Montezuma (14), Teddy (20)

(Leaders 1 and 2 = "O jogador escolhe" / "Aleatório" — leave without tier; default to 1pt.)

- [ ] **Step 1: Add `tier` to each leader entry**

For each civilization with id ≥ 3, add `"tier": "<S|A|B|C>"` after `wikiLink`. Example for Gilgamesh (id 9):

```json
{"id": 9, "civilization": "Suméria", "civIcon": "...", "leader": "Gilgamesh", "leaderPortrait": "...", "wikiLink": "https://civilization.fandom.com/wiki/Gilgamesh_(Civ6)", "tier": "S"}
```

Apply mapping above to all 20 entries (ids 3-22). Leave ids 1 and 2 unchanged.

- [ ] **Step 2: Validate JSON parses**

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('public/data/leaders.json','utf8')).civilizations.length)"`
Expected output: `22`

- [ ] **Step 3: Commit**

```bash
git add public/data/leaders.json
git commit -m "balance: add tier (S/A/B/C) to each Civ VI leader"
```

---

### Task 12: Extend types — `tier` on `LeaderEntry`, `baseWeight` on `SelectFieldSchema`

**Files:**
- Modify: `lib/lobbyTypes.ts:50-58` (`SelectFieldSchema`)
- Modify: `components/game/VotingField.tsx:7-13` (`LeaderEntry`)

- [ ] **Step 1: Add `baseWeight` to `SelectFieldSchema`**

In `lib/lobbyTypes.ts`, edit the `SelectFieldSchema` type. After the `excludeLeaderIds` line, add `baseWeight?: number;`:

```ts
export type SelectFieldSchema = {
  type: "select";
  label: string;
  default: string | number | null;
  options?: SelectOption[];
  leadersSource?: string;
  excludeLeaderIds?: number[];
  baseWeight?: number;
  description?: string;
};
```

- [ ] **Step 2: Add `tier` to `LeaderEntry`**

In `components/game/VotingField.tsx`, edit the `LeaderEntry` export type. After `leaderPortrait?: string;`:

```ts
export type LeaderEntry = {
  id: number;
  civilization: string;
  leader: string;
  civIcon?: string;
  leaderPortrait?: string;
  tier?: "S" | "A" | "B" | "C";
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run lint`
Expected: PASS, no type errors.

- [ ] **Step 4: Commit**

```bash
git add lib/lobbyTypes.ts components/game/VotingField.tsx
git commit -m "balance: add baseWeight and leader tier types"
```

---

### Task 13: Wire tier → option weight in `buildSelectOptions`

**Files:**
- Modify: `components/game/VotingField.tsx:297-318` (`buildSelectOptions`)

Currently the `leadersSource` branch hardcodes `weight: 1`. Replace with tier-derived weight, floored by `baseWeight`.

- [ ] **Step 1: Add tier→weight mapping helper**

In `components/game/VotingField.tsx`, just above the `buildSelectOptions` function, add:

```ts
const TIER_WEIGHT: Record<NonNullable<LeaderEntry["tier"]>, number> = {
  S: 5,
  A: 3,
  B: 2,
  C: 1,
};

function leaderWeight(leader: LeaderEntry, baseWeight: number): number {
  const tierW = leader.tier ? TIER_WEIGHT[leader.tier] : 1;
  return Math.max(tierW, baseWeight);
}
```

- [ ] **Step 2: Use helper inside `buildSelectOptions`**

Replace the `if (schema.leadersSource)` branch of `buildSelectOptions` with:

```ts
  if (schema.leadersSource) {
    const excluded = new Set(schema.excludeLeaderIds ?? []);
    const baseWeight = schema.baseWeight ?? 1;
    return leaders
      .filter((l) => l.id >= 1 && !excluded.has(l.id))
      .map((l) => ({
        value: l.id,
        label: `${l.leader} (${l.civilization})`,
        weight: leaderWeight(l, baseWeight),
        civIcon: l.civIcon,
        leaderPortrait: l.leaderPortrait,
      }));
  }
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Smoke test**

Run: `npm run dev`. Open a room, start game. In the `Civilização` dropdown:
- Confirm Gilgamesh / Tomyris / Pedro show `5 pts`
- Confirm Frederico / Hojo / Saladino show `3 pts`
- Confirm Cleópatra / Montezuma / Teddy show `1 pt`

In the `Banir civilização` dropdown:
- Confirm Cleópatra / Montezuma / Teddy show `3 pts` (floored by baseWeight=3)
- Confirm Gilgamesh shows `5 pts` (tier > floor)

- [ ] **Step 5: Commit**

```bash
git add components/game/VotingField.tsx
git commit -m "balance: per-leader tier pricing for civilization and ban votes"
```

---

### Task 14: Verify rumors and final-config pages still work

**Files:**
- Read-only check: `lib/rumors.ts`, `components/game/GameOverScreen.tsx` (and any consumer of `VoteCast.weight`)

`weight` is stored on each `VoteCast` (set from `option.weight` at vote time). Per-leader weights now flow through that path. Need to ensure no consumer assumes a fixed `weight: 1` for leader votes.

- [ ] **Step 1: Grep for hardcoded leader weight assumptions**

Run:
```bash
grep -rn "weight.*: 1" components/ lib/ app/ --include="*.ts" --include="*.tsx"
```
Inspect results. Any reference that assumes leader votes are always `weight: 1` is a bug — note in PR description.

- [ ] **Step 2: Manual smoke — full game cycle**

Run: `npm run dev`. Create room, vote on a Civ tier S leader, end turn, observe:
- Between-turns rumor mentions vote correctly
- `pointsRemaining` decremented by tier weight (e.g. 5 for S)
- Final reveal shows leader name correctly

- [ ] **Step 3: If all pass, no commit needed (read-only verification)**

If a bug is found, write a follow-up task or open a separate issue — don't fix inside this plan.

---

## Phase 4 — Documentation update

### Task 15: Update `docs/balance-review.md` to reflect applied changes

**Files:**
- Modify: `docs/balance-review.md`

- [ ] **Step 1: Mark applied items**

For each section corresponding to Tasks 1-13, prepend `**[APPLIED 2026-04-24]**` to the heading. Leave "Faltando" section untouched (out of scope).

- [ ] **Step 2: Commit**

```bash
git add docs/balance-review.md
git commit -m "docs: mark applied balance fixes in balance-review"
```

---

## Self-Review

**Spec coverage** — `docs/balance-review.md` issues mapped:
- §1 bannedCivilizations → Tasks 1 + 11-13
- §2 civilization tier → Tasks 11-13
- §3 disabledVictoryConditions → Task 2
- §4 startingPosition → Task 3
- §5 maxCities → Task 4
- §6 difficulty → Task 5
- §7 barbarians → Task 6
- §8 tribalVillages → Task 7
- §9 seaLevel → Task 8
- §10 cityStates default → Task 9
- §11 maxIdleTurns → Task 10
- §12 randomCivicMode → intentionally skipped (review marks "borderline acceptable")
- "Faltando" section (game speed, map size, modes, etc.) → out of scope, separate plan needed

**Placeholder scan** — Task 10 contains a soft "if unsure, mark TODO" — this is conditional copy guidance, not a placeholder in the implementation. All other tasks have exact JSON/TS code.

**Type consistency** — `baseWeight` added to `SelectFieldSchema` (Task 12) is consumed in Task 13. `tier` added to `LeaderEntry` (Task 12) consumed by `leaderWeight` helper (Task 13). `TIER_WEIGHT` keys match the `tier` union type. ✓
