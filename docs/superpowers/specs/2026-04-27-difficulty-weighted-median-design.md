# Design: Resolução de Dificuldade por Média Ponderada

**Data:** 2026-04-27  
**Escopo:** `party/index.ts` apenas  
**Status:** Aprovado

## Problema

O sistema atual resolve todos os campos `select` por pluralidade pura (opção com mais peso acumulado vence). Para `difficulty`, isso cria empates quando votos se distribuem em extremos opostos — ex: 5pts em "Colono" e 5pts em "Divindade" — forçando o host a desempatar manualmente, mesmo quando a intenção coletiva é uma dificuldade intermediária.

## Solução

Para o campo `difficulty` (escopo por jogador), usar média ponderada do índice ordinal em vez de pluralidade.

### Algoritmo

```
DIFFICULTY_ORDER = [
  "settler", "chieftain", "warlord", "prince",
  "king", "emperor", "immortal", "deity"
]

weightedSum = Σ (index(option) × weight(option))  para cada opção com votos
totalWeight = Σ weight(option)

se totalWeight === 0:
  → sem votos; retorna { winner: null, tied: true } → host desempata (fluxo existente)
senão:
  → avgIndex = Math.round(weightedSum / totalWeight)
  → winner = DIFFICULTY_ORDER[avgIndex]
```

### Exemplos

| Votos | Cálculo | Resultado |
|-------|---------|-----------|
| Colono(5) + Divindade(5) | (0×5 + 7×5)/10 = 3.5 → round → 4 | **Rei** |
| Colono(3) + Príncipe(7) | (0×3 + 3×7)/10 = 2.1 → round → 2 | **Senhor da Guerra** |
| Divindade(10) | 7.0 → round → 7 | **Divindade** |
| Sem votos | totalWeight = 0 | **Host desempata** |

## Implementação

**Arquivo:** `party/index.ts`

1. Adicionar constante `DIFFICULTY_ORDER` no topo do arquivo.
2. Adicionar função `resolveOrderedField(prefix: string): ResolveResult` que implementa o algoritmo acima usando `this.accumulator`.
3. No método `resolveField`, detectar `field === "difficulty"` e delegar para `resolveOrderedField` em vez da lógica de pluralidade.

## O que NÃO muda

- Mecânica de votação (cast/remove) — inalterada
- Estrutura de `FinalConfig` — inalterada
- Cliente (`GamePage`, `GameOverScreen`, `VotingField`) — inalterados
- Schema `config.json` — inalterado
- Fluxo de tie-break do host — reutilizado apenas para o caso sem votos
- Todos os outros campos (`civilization`, `mapType`, etc.) — continuam com pluralidade

## Extensibilidade futura

Quando necessário aplicar a outros campos ordenados, adicionar `"ordered": true` no schema e passar a ordem via `RoomConfig`. Por ora, hardcoded apenas para `difficulty`.
