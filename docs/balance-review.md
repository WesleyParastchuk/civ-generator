# Balance Review — Civ Generator vs Civilization VI

> Análise de balanceamento do sistema de votação (`public/data/config.json`) comparando com mecânicas e impacto real dos parâmetros em Civilization VI.
>
> Data: 2026-04-24
> Referência: `public/data/config.json`, `components/home/OptionsPreview.tsx`, `components/game/VotingField.tsx`

## Contexto do sistema

- **Orçamento total**: `turns × pointsPerTurn` (mín 1, máx 500)
- **Tipos de voto**: `select` (peso por opção), `toggle` (peso fixo), `range` (peso Fibonacci por distância do default)
- **Pesos Fibonacci range**: step 1 → 1pt, step 2 → 2pt, step 3 → 3pt, step 4 → 5pt, step 5 → 8pt...

---

## Issues críticos

### 1. `bannedCivilizations` — peso 1pt

**Problema**: Banir qualquer líder custa 1 ponto. Grief trivial já no primeiro turno.

**Civ VI**: Tiers de líder variam drasticamente (S/A/B/C). Banir S-tier ≠ banir C-tier.

**Fix sugerido**:
- Peso escalonado por tier: S-tier (Gilgamesh, Kupe, Poundmaker, Basil II, Saladin, Gitarja) → 5pt
- Alternativa: peso flat mínimo 3-5pt

### 2. `civilization` (select de líder) — peso 1pt flat

**Problema**: Todo líder custa igual para votar. Meta dominante trivialmente forçável.

**Civ VI**: Líderes muito desbalanceados. Top tier com vantagens compostas (Gilgamesh early war + ziggurat, Kupe tall ocean start).

**Fix sugerido**: Peso por tier. Top tier caro, fracos (ex.: Cleópatra Egito padrão, Kublai Khan chinês) baratos.

### 3. `disabledVictoryConditions` — tudo peso 1pt

**Problema**: Desabilitar Dominação (core path) custa igual a desabilitar Pontuação (quase sem efeito).

**Civ VI**: Science/Culture/Domination são os 3 caminhos principais. Score é tiebreaker.

**Fix sugerido**:
- Dominação/Científica/Cultural → 3pt
- Religiosa → 2pt
- Score → 1pt

### 4. `startingPosition: legendary` — peso 1pt

**Problema**: Legendary start = vantagem enorme (rios + colinas + recursos bônus). Mesmo custo de "Padrão" absurdo.

**Fix sugerido**:
- `balanced` → 1pt (default)
- `standard` → 1pt
- `legendary` → 3pt

### 5. `maxCities: same_as_others` — peso 2pt

**Problema**: Regra house-rule (não-nativa Civ VI). Anti-snowball massivo. Quebra estratégias wide. 2pt barato demais.

**Fix sugerido**: 5-8pt. Reflete magnitude da regra.

---

## Issues médios

### 6. `difficulty` — escala assimétrica estranha

**Problema atual**:
```
Settler=4, Chieftain=3, Warlord=2, Prince=1 (default), King=1, Emperor=2, Immortal=4, Deity=5
```
- King=1 mesmo sendo +1 step do default
- Settler=4 significa jogar fácil custa igual Immortal

**Fix sugerido** (Civ VI-style, step-based):
- Prince (default) → 1pt
- Warlord/King → 1pt (±1 step)
- Chieftain/Emperor → 2pt (±2 steps)
- Settler/Immortal → 3pt (±3 steps)
- Deity → 5pt (+4 steps)

### 7. `barbarians` — inconsistência

**Problema atual**: `disabled`=3pt, `clan_mode`=2pt, `standard`=1pt (default).

**Análise**: Clan mode = mecânica totalmente diferente (New Frontier Pass), não menos impacto que disabled.

**Fix sugerido**: ambos `disabled` e `clan_mode` → 3pt.

### 8. `tribalVillages: disabled` — peso 3pt

**Problema**: Villages = impacto pequeno-médio (early boosts aleatórios). 3pt alto comparado a outros elementos de 1pt com mais impacto.

**Fix sugerido**: 2pt.

### 9. `seaLevel` — assimetria sem razão

**Problema atual**: `high`=2pt, `low`=1pt. Ambos desviam igualmente do standard mas custam diferente.

**Fix sugerido**: ambos 1pt ou ambos 2pt.

### 10. `cityStates` default 9

**Problema**: Civ VI standard map = 12 CS. Default 9 já abaixo do padrão real.

**Fix sugerido**: mudar default para 10-12.

### 11. `maxIdleTurns` default 0 — semântica confusa

**Problema**: "Turnos parado = 0" não comunica o que acontece. Jogador deve ficar 0 turnos parado? Sempre? Nunca?

**Fix sugerido**: clarificar label/descrição ou renomear campo.

### 12. `randomCivicMode` — peso 5pt

**Análise**: OK isoladamente. Invalida build orders inteiros. Talvez 6-7pt mais apropriado dada magnitude.

**Veredicto**: aceitável, borderline.

---

## Faltando (Civ VI tem, aqui não)

Opções presentes em Civ VI com impacto enorme de balance, ausentes aqui:

- **Game speed**: Online / Quick / Standard / Epic / Marathon — multiplier gigante em todos tempos de pesquisa/produção
- **Map size**: Duel / Tiny / Small / Standard / Large / Huge — afeta economia, expansão, diplomacia
- **Era start**: Ancient / Classical / Medieval / Renaissance / Industrial / Atomic / Information — muda partida inteira
- **Game modes** (New Frontier Pass + DLCs):
  - Secret Societies
  - Heroes & Legends
  - Monopolies & Corporations
  - Dramatic Ages
  - Tech/Civic Shuffle
  - Zombies
  - Apocalypse
  - Barbarian Clans (presente como barbarians.clan_mode, mas isolado)
- **Disaster intensity** (0-4) — Gathering Storm mechanic core
- **Score victory turn limit** — quantos turnos até fim forçado

---

## Prioridades de ação

Top 3 fixes urgentes:

1. **`bannedCivilizations` → 3-5pt**. Griefing barato demais, maior problema competitivo.
2. **`startingPosition: legendary` → 3pt**. Paridade de peso absurda.
3. **`disabledVictoryConditions` → tier 1-3pt**. Dominação ≠ Score em impacto.

Médio prazo:

4. Rebalancear `difficulty` como escala step-based simétrica.
5. Peso por tier em `civilization` (requer tabela tier-list manutenida).
6. Revisar default de `cityStates` para 10-12.

Longo prazo:

7. Adicionar opções faltantes (game speed, map size, game modes).
8. Clarificar `maxIdleTurns` (descrição ou renomear).
