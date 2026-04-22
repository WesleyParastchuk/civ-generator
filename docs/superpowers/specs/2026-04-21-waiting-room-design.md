# Spec: Sala de Espera com Tempo Real

**Data:** 2026-04-21  
**Escopo:** Criação de sala + sala de espera multijogador em tempo real  
**Fora de escopo:** O mini-game em si após todos clicarem "pronto" (iteração futura)

---

## Visão Geral

Antes de uma partida de Civilization VI, o criador abre uma sala com configurações (turnos e pontos por turno), compartilha um link com os outros jogadores, e todos aguardam na sala de espera marcando "pronto". O sistema usa PartyKit para WebSocket em tempo real e mantém estado exclusivamente in-memory.

---

## Stack

- **Frontend:** Next.js 16 App Router + TypeScript + Tailwind CSS v4 + lucide-react (existente)
- **Tempo real:** PartyKit (`@party-kit/partykit`, `@party-kit/react`)
- **Persistência:** Nenhuma — estado in-memory no PartyKit
- **Deploy:** Vercel (Next.js) + PartyKit (deploy próprio, integração nativa com Vercel)

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Home existente — ajustada para gerar código e navegar ao lobby |
| `/jogo/[code]` | Sala de espera — formulário de nickname (visitantes) ou sala direta (host) |

---

## Fluxo de Navegação

### Criador da sala
1. Preenche nickname, turnos e pontos por turno na página `/`
2. Clica "Iniciar seleção"
3. Cliente gera código de 6 caracteres alfanuméricos maiúsculos (ex.: `A3FX9K`)
4. Salva `{ nickname, turns, pointsPerTurn, isHost: true }` no `sessionStorage` com chave `lobby-[code]`
5. Navega para `/jogo/[code]`
6. Página detecta `sessionStorage`, conecta direto ao PartyKit como host

### Visitante (via link compartilhado)
1. Abre `https://[site]/jogo/[code]`
2. Não há dados no `sessionStorage` → página exibe formulário de nickname
3. Digita nickname, clica "Entrar"
4. Conecta ao PartyKit como jogador comum

---

## Geração do Código

- Charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sem caracteres ambíguos: O, 0, I, 1)
- Tamanho: 6 caracteres
- Gerado no cliente com `crypto.getRandomValues` para distribuição uniforme
- Probabilidade de colisão desprezível para uso casual (32^6 ≈ 1 bilhão de combinações)

---

## PartyKit Server (`party/index.ts`)

### Estado por sala

```ts
type Player = {
  nickname: string
  ready: boolean
  isHost: boolean
}

type RoomState = {
  config: { turns: number; pointsPerTurn: number } | null
  players: Map<string, Player>          // key = connectionId
  cleanupTimer: ReturnType<typeof setTimeout> | null
}
```

### Mensagens cliente → servidor

| Tipo | Payload | Descrição |
|------|---------|-----------|
| `join` | `{ nickname, isHost, config? }` | Primeira mensagem; host inclui config |
| `toggle_ready` | — | Alterna status pronto do remetente |
| `ping` | — | Heartbeat para resetar timer de inatividade |

### Mensagens servidor → todos os clientes

| Tipo | Payload | Descrição |
|------|---------|-----------|
| `room_update` | `{ config, players: Player[] }` | Broadcast completo após qualquer mudança |
| `room_expired` | — | Sala expirou por inatividade |

### Lifecycle

- **`onConnect`:** Aguarda mensagem `join` antes de registrar o jogador. Reseta o timer.
- **`onMessage`:** Processa `join`, `toggle_ready`, `ping`. Reseta o timer a cada mensagem.
- **`onClose`:** Remove o jogador da lista, faz broadcast de `room_update`, reseta o timer. Se a sala ficar vazia, cancela o timer (PartyKit libera memória automaticamente sem conexões).

### Cleanup por inatividade

- `setTimeout` de **30 minutos**, resetado a cada mensagem recebida de qualquer jogador
- Quando dispara: broadcast de `room_expired` → servidor fecha todas as conexões
- PartyKit desaloca o room automaticamente após última conexão fechar

---

## Componentes Frontend

### Ajuste na rota `/`

`HeroPanel.tsx` — `handleStartSubmit` passa a:
1. Gerar o código com `generateRoomCode()`
2. Salvar config no `sessionStorage`
3. Chamar `router.push('/jogo/' + code)` (usando `next/navigation`)

### Nova rota `/jogo/[code]`

```
app/jogo/[code]/page.tsx        — Server Component (apenas passa params)
app/jogo/[code]/LobbyPage.tsx   — Client Component principal
```

### Novos componentes

```
components/lobby/
  LobbyPanel.tsx        — Container principal, espelha HeroPanel com colunas gregas
  RoomCodeDisplay.tsx   — Código em Cinzel grande + botão copiar + botão compartilhar
  PlayerList.tsx        — Grid/lista de PlayerCards
  PlayerCard.tsx        — Card de jogador: nickname, ícone de status, badge de host
  ReadyButton.tsx       — Toggle pronto/cancelar com variação visual por estado
  RoomConfigBadge.tsx   — Badges de turnos e pontos (padrão visual do HeroPanel)
  NicknameGate.tsx      — Formulário de nickname para visitantes (antes de conectar)
```

### Comportamento dos componentes

**`PlayerCard`:**
- Pronto: borda gold intensa, ícone `ShieldCheck` (lucide)
- Aguardando: borda sutil, ícone `Hourglass` com opacidade 60%
- Host: badge `Crown` ao lado do nickname

**`RoomCodeDisplay`:**
- Código exibido em `font-[var(--font-cinzel)]`
- Botão copiar: copia `window.location.href` → feedback visual "Copiado!" por 2s
- Botão compartilhar: `navigator.share({ url, title })` com fallback silencioso para clipboard

**`ReadyButton`:**
- `ready = false`: gradiente gold, texto "Pronto", ícone `Swords`
- `ready = true`: fundo escuro sóbrio, texto "Cancelar pronto", ícone `X`

**`NicknameGate`:**
- Reutiliza `.game-text-input` e o padrão visual de `StartButton`
- Validação: `minLength=2`, `maxLength=20`, obrigatório

---

## Utilitários

```
lib/
  generateRoomCode.ts   — Geração de código com crypto.getRandomValues
  sessionLobby.ts       — get/set/clear de dados do lobby no sessionStorage
```

---

## Estilo

Todos os novos componentes seguem o design system existente em `globals.css`:
- Classes: `.game-card`, `.game-text-input`, `.game-control-button`, `.imperial-border`, `.greek-column`
- Paleta: `--civ-gold-*`, `--civ-blue-*`
- Fontes: `--font-cinzel` para títulos/código, `--font-source-sans` para corpo
- Animações: `game-rise-in` para entrada de componentes

---

## Estrutura de Arquivos (delta)

```
party/
  index.ts                              — PartyKit server

app/
  jogo/
    [code]/
      page.tsx                          — Server Component wrapper
      LobbyPage.tsx                     — Client Component

components/
  lobby/
    LobbyPanel.tsx
    RoomCodeDisplay.tsx
    PlayerList.tsx
    PlayerCard.tsx
    ReadyButton.tsx
    RoomConfigBadge.tsx
    NicknameGate.tsx

lib/
  generateRoomCode.ts
  sessionLobby.ts
```

---

## Dependências a instalar

```bash
npm install partysocket
npx partykit init   # cria party/index.ts e partykit.json
```

`partykit` é instalado como CLI global ou via `npx`. `partysocket` é a lib cliente (inclui hook `usePartySocket` para React).
