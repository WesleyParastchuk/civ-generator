# Plano de Implementação: Pacotes Temáticos

## Visão Geral

Pacote = opção de votação que, se vencer, **travaria N campos** de `matchConfig` com valores predefinidos. Campos não travados continuam sendo votados normalmente nos turnos restantes.

### Fluxo esperado
1. Turno 1 começa → exibe carousel de pacotes.
2. Jogadores votam em pacote (ou "Nenhum") com seus pontos.
3. Pacote com mais votos vence → `overrides` aplicados ao `accumulator` do servidor como votos com peso máximo.
4. Campos não afetados pelo pacote → votação normal nos turnos seguintes.
5. Turno 2+ → UI não mostra mais o carousel, só os campos normais.

---

## Arquitetura

### Camadas envolvidas

```
public/data/config.json       ← novo array "packs"
lib/lobbyTypes.ts             ← novos tipos Pack, PackVote, mensagens
party/index.ts (PartyKit)     ← lógica de super-voto de pacote
components/game/PackPanel.tsx ← novo componente UI (carousel)
app/jogo/[code]/game/GamePage.tsx ← integrar PackPanel no turno 1
```

---

## Passo 1: `public/data/config.json`

Adicionar campo `packs` no nível raiz (ao lado de `matchConfig` e `playerConfig`).

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
    "description": "Pangeia fria e árida com mar alto. Escassez extrema, foco em rotas comerciais.",
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
    "description": "Tudo aleatório. Modo cívico aleatório ativado. Nenhuma preparação possível.",
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

---

## Passo 2: `lib/lobbyTypes.ts`

### Novos tipos

```typescript
// Pacote temático (lido de config.json)
export type Pack = {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "chaotic" | "neutral";
  overrides: Partial<Record<string, string | number | boolean>>;
};

// Schema completo de config.json (adicionar packs ao tipo existente)
export type GameConfigSchema = {
  matchConfig: Record<string, ConfigFieldSchema>;
  playerConfig: Record<string, ConfigFieldSchema>;
  packs?: Pack[];  // ← adicionar aqui
};
```

### Nova mensagem cliente → servidor

```typescript
// Em ClientMessage (union existente), adicionar:
| { type: "cast_pack_vote"; payload: { packId: string; weight: number } }
| { type: "remove_pack_vote" }
```

### Novo campo em `VotingState`

```typescript
export type VotingState = {
  // ... campos existentes ...
  packVotes?: Record<string, number>;   // packId → total weight
  myPackVote?: { packId: string; weight: number }; // filtrado por player no servidor ou no cliente
  activePackId?: string | null;         // null enquanto turno 1 em votação; preenchido após turno 1
};
```

---

## Passo 3: `party/index.ts` (PartyKit)

### Novos campos no servidor

```typescript
// Adicionar em LobbyServer:
packVotes: Map<string, { packId: string; weight: number }> = new Map(); // voterId → seu voto de pack
activePackId: string | null = null;   // pack vencedor (definido no endTurn do turno 1)
```

### Handler de voto de pacote

```typescript
} else if (msg.type === "cast_pack_vote") {
  if (this.gamePhase !== "playing") return;
  if (this.currentTurn !== 1) return;           // só no turno 1
  if (!this.players.has(sender.id)) return;

  const { packId, weight } = msg.payload;
  if (weight < 1) return;

  const ledger = this.currentLedger!;
  const spent = ledger.spendByVoter[sender.id] ?? 0;
  if (this.config!.pointsPerTurn - spent < weight) return;

  // Remove voto anterior deste jogador (1 voto de pack por jogador)
  const prev = this.packVotes.get(sender.id);
  if (prev) {
    ledger.spendByVoter[sender.id] = Math.max(0, (ledger.spendByVoter[sender.id] ?? 0) - prev.weight);
  }

  this.packVotes.set(sender.id, { packId, weight });
  ledger.spendByVoter[sender.id] = spent + weight;
  this.broadcastVotingState();

} else if (msg.type === "remove_pack_vote") {
  if (this.gamePhase !== "playing") return;
  if (this.currentTurn !== 1) return;
  const prev = this.packVotes.get(sender.id);
  if (!prev) return;

  const ledger = this.currentLedger!;
  ledger.spendByVoter[sender.id] = Math.max(0, (ledger.spendByVoter[sender.id] ?? 0) - prev.weight);
  this.packVotes.delete(sender.id);
  this.broadcastVotingState();
}
```

### Resolução do pacote no `endTurn` (turno 1)

```typescript
// No início de endTurn(), antes do broadcast:
if (this.currentTurn === 1 && this.packVotes.size > 0) {
  this.activePackId = this.resolvePackVote();
  this.applyPackOverrides(this.activePackId);
  this.packVotes.clear();
}
```

```typescript
resolvePackVote(): string {
  const totals = new Map<string, number>();
  for (const { packId, weight } of this.packVotes.values()) {
    totals.set(packId, (totals.get(packId) ?? 0) + weight);
  }
  let winner = "none";
  let max = 0;
  for (const [packId, total] of totals) {
    if (total > max) { max = total; winner = packId; }
  }
  return winner;
}

applyPackOverrides(packId: string) {
  // Packs são carregados dos dados do config.json.
  // No PartyKit, acessar via fetch ou injetar como const importada.
  // Opção mais simples: host envia packs junto com RoomConfig no join.
  // Opção alternativa: servidor faz fetch de /data/config.json.
  //
  // Para cada campo em overrides, injeta no accumulator com peso alto
  // para garantir vitória no consolidateFinalConfig():
  if (!this.packsData) return;
  const pack = this.packsData.find(p => p.id === packId);
  if (!pack || packId === "none") return;

  const HIGH_WEIGHT = 9999;
  for (const [field, value] of Object.entries(pack.overrides)) {
    const key = accumulatorKey("match", field, value as string | number | boolean);
    this.accumulator[key] = (this.accumulator[key] ?? 0) + HIGH_WEIGHT;
    if (!this.breakdown[key]) this.breakdown[key] = {};
    this.breakdown[key]["__pack__"] = HIGH_WEIGHT;
  }
}
```

### Como passar os dados do pack pro servidor

**Opção A (mais simples)**: host inclui `packs` no payload de `join` / `update_config`. Adicionar ao `RoomConfig`:

```typescript
export type RoomConfig = {
  turns: number;
  pointsPerTurn: number;
  turnDurationSeconds: number;
  packs?: Pack[];   // ← host envia ao criar sala; servidor guarda
};
```

**Opção B**: servidor faz `fetch("/data/config.json")` no `onConnect`. Funciona mas adiciona latência.

**Recomendação**: Opção A. Host já carrega `config.json` no cliente; empurra `packs` junto com o resto do `RoomConfig`.

### Campo `packVotes` no `buildVotingStateMsg`

```typescript
// Agregar totais de pack para broadcast:
const packVoteTotals: Record<string, number> = {};
for (const { packId, weight } of this.packVotes.values()) {
  packVoteTotals[packId] = (packVoteTotals[packId] ?? 0) + weight;
}

// Adicionar ao state:
...(this.currentTurn === 1 ? { packVotes: packVoteTotals } : {}),
...(this.activePackId !== null ? { activePackId: this.activePackId } : {}),
```

---

## Passo 4: `components/game/PackPanel.tsx` (novo componente)

### Responsabilidades
- Exibir carousel de cards (um por pack).
- Mostrar nome, descrição, difficulty badge, campos travados.
- Mostrar total de votos por pack (do `packVotes` do `VotingState`).
- Botão "Votar neste pacote" (custa pontos) + "Remover voto".
- Colapsável/deslizável — aparece só no turno 1.

### Interface

```typescript
type PackPanelProps = {
  packs: Pack[];
  packVotes: Record<string, number>;    // packId → total group weight
  myPackVote: { packId: string; weight: number } | null;
  pointsRemaining: number;
  onVote: (packId: string, weight: number) => void;
  onRemoveVote: () => void;
};
```

### UI sketch

```
┌─────────────────────────────────────────────────────┐
│  🎲 Pacote Temático   turno 1 · escolha opcional    │
├──────────────────────────────────────────────────────│
│  ← [Jardim] [Apocalipse] [Descobrimento] [Caos] →  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🌊 DESCOBRIMENTO               [FÁCIL]          │  │
│  │ Arquipélagos, posição lendária, recursos      │  │
│  │ abundantes. Foco em exploração naval.         │  │
│  │                                                │  │
│  │ Trava: Mapa=Arquipélago · Pos.=Lendária       │  │
│  │        Recursos=Abundante · Úmido             │  │
│  │                                                │  │
│  │ 🗳 Grupo: 3 pts   Você: 2 pts                  │  │
│  │ [Remover]  [Votar · 2 pts]                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Sem pacote: [Votar em Nenhum · 1 pt]               │
└─────────────────────────────────────────────────────┘
```

### Difficulty badges (cores por nível)

| Difficulty | Label | Cor |
|------------|-------|-----|
| easy | Fácil | verde |
| medium | Médio | amarelo |
| hard | Difícil | laranja |
| chaotic | Caótico | roxo |
| neutral | Nenhum | cinza |

---

## Passo 5: Integrar `PackPanel` em `GamePage.tsx`

### Lógica de exibição

```typescript
// PackPanel aparece APENAS no turno 1 e apenas na fase "playing"
const showPackPanel = votingState?.currentTurn === 1 
  && votingState?.phase === "playing"
  && !votingState?.activePackId;

// activePackId fica disponível após turno 1 (informativo)
const activePackId = votingState?.activePackId;
```

### Posicionamento no layout

- Antes da lista de campos de votação (`VotingField`).
- Após o `TurnHeader`.
- Colapsável: usuário pode fechar se não quiser votar em pacote.

### Handlers

```typescript
const handlePackVote = useCallback((packId: string, weight: number) => {
  ws.send(JSON.stringify({
    type: "cast_pack_vote",
    payload: { packId, weight }
  } satisfies ClientMessage));
}, [ws]);

const handlePackRemoveVote = useCallback(() => {
  ws.send(JSON.stringify({ type: "remove_pack_vote" } satisfies ClientMessage));
}, [ws]);
```

### Indicador de pack ativo (turnos 2+)

Banner sutil no topo do `VotingField` area mostrando "Pacote ativo: Apocalipse — 4 campos travados". Campos travados ficam com UI diferente (badge "travado pelo pacote", sem botão de voto).

---

## Passo 6: Campos Travados na UI

Campos cujo `field` está em `activePackId.overrides` devem aparecer como "travados" em vez de votáveis.

### Abordagem

```typescript
// Em GamePage.tsx, calcular conjunto de campos travados:
const lockedFields = useMemo(() => {
  if (!activePackId || !configSchema?.packs) return new Set<string>();
  const pack = configSchema.packs.find(p => p.id === activePackId);
  return new Set(Object.keys(pack?.overrides ?? {}));
}, [activePackId, configSchema]);

// Passar lockedFields pra cada VotingField:
<VotingField
  {...fieldProps}
  locked={lockedFields.has(fieldKey)}
  lockedValue={activePackId ? pack?.overrides[fieldKey] : undefined}
/>
```

### UI de campo travado

- Fundo diferente (azul escuro mais opaco).
- Badge "🔒 Travado pelo pacote".
- Mostra o valor travado (ex: "Mapa: Arquipélago").
- Sem botão de voto.

---

## Ordem de Implementação

1. **`config.json`** — adicionar `packs`. (15min)
2. **`lobbyTypes.ts`** — tipos `Pack`, novos `ClientMessage`, campos em `VotingState` e `RoomConfig`. (20min)
3. **`party/index.ts`** — handlers de pack vote, `resolvePackVote`, `applyPackOverrides`, broadcast. (60min)
4. **`PackPanel.tsx`** — componente UI. (60min)
5. **`GamePage.tsx`** — integrar `PackPanel`, `lockedFields`, indicador de pack ativo. (30min)

**Total estimado: ~3h**

---

## Notas de Implementação

### Peso do voto de pacote
- Usar `1 pt` como custo base (igualzinho a votar em qualquer campo).
- Jogador pode gastar mais pra "fortalecer" o voto de pacote se quiser (mesma mecânica de qualquer voto).

### Empate de pacote
- Se dois pacotes empatam, resolver por `"none"` (sem pacote vence empate). Alternativa: tie-break manual (host escolhe). Começar com "none" wins tie.

### Campos de overrides conflitantes
- Se jogador votou em campo individual E o pacote travou aquele campo: override do pacote tem peso 9999, voto do jogador persiste no accumulator mas perde. Campo aparece como "travado" na UI e o voto individual vira crédito perdido — **portanto** é melhor bloquear o botão de voto em campos do pacote ainda no turno 1, antes do reveal. Ao selecionar um pacote no `PackPanel`, mostrar aviso: "Estes campos ficarão travados: [lista]".

### Pacotes não aparecem depois do turno 1
- Após `endTurn()` do turno 1, `packVotes` é cleared e `activePackId` fica só como info.
- Clientes com `currentTurn >= 2` não renderizam `PackPanel`.
