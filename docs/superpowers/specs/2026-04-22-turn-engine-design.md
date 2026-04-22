# Turn Engine Design

## Goal

Implement a server-authoritative turn engine for the Civ VI pre-game voting mini-game. Each turn gives players points to spend (voting mechanic TBD), has a configurable timer, and advances automatically when all players finish or time runs out.

## Config Changes

`RoomConfig` gains a third field:

```ts
type RoomConfig = {
  turns: number;          // 1–10, existing
  pointsPerTurn: number;  // 1–50, existing
  secondsPerTurn: number; // 10–300, new (default 60)
};
```

`secondsPerTurn` appears in:
- Home screen (`OptionsPreview`) — host sets before creating room
- Lobby screen (`ConfigPanel`) — host can edit, others see summary text only

## Types

### `lib/gameTypes.ts` (new file)

```ts
export type GamePhase = "playing" | "between_turns" | "finished";

export type GameState = {
  phase: GamePhase;
  currentTurn: number;              // 1-indexed
  totalTurns: number;
  turnRemainingMs: number;          // computed at broadcast time
  finishedCount: number;
  totalPlayers: number;
  playerPoints: Record<string, number>;  // connectionId → accumulated points
  config: RoomConfig;
};
```

### New `ClientMessage` variants (in `lib/lobbyTypes.ts`)

```ts
| { type: "finish_turn" }
```

### New `ServerMessage` variants (in `lib/lobbyTypes.ts`)

```ts
| { type: "game_state"; payload: GameState }
| { type: "game_over"; payload: { playerPoints: Record<string, number> } }
```

## Server Architecture (`party/index.ts`)

### New state fields on `LobbyServer`

```ts
gamePhase: GamePhase | null = null;
currentTurn = 0;
turnEndsAt = 0;                          // Date.now() + secondsPerTurn * 1000
finishedInTurn = new Set<string>();      // connectionIds who clicked finish_turn this turn
playerPoints = new Map<string, number>(); // accumulated points per player
turnTimer: ReturnType<typeof setTimeout> | null = null;
```

### Turn lifecycle

**`startGame()`** — called after the 5-second lobby countdown fires:
1. Initialize `playerPoints`: every connected player gets `config.pointsPerTurn` points.
2. Set `currentTurn = 1`, `gamePhase = "playing"`.
3. Call `startTurn()`.

**`startTurn()`**:
1. Credit `config.pointsPerTurn` to every player (except on turn 1, already done in `startGame()`).
2. Clear `finishedInTurn`.
3. Set `turnEndsAt = Date.now() + config.secondsPerTurn * 1000`.
4. Schedule `this.turnTimer = setTimeout(() => this.endTurn(), config.secondsPerTurn * 1000)`.
5. Set `gamePhase = "playing"`.
6. Broadcast `game_state`.

**On `finish_turn` message**:
1. Add `sender.id` to `finishedInTurn`.
2. Broadcast `game_state` (finishedCount updates for all).
3. If `finishedInTurn.size >= this.players.size`: cancel `turnTimer`, call `endTurn()`.

**`endTurn()`**:
1. Cancel `turnTimer` if still running.
2. If `currentTurn < config.turns`:
   - Set `gamePhase = "between_turns"`.
   - Broadcast `game_state`.
   - `setTimeout(() => { this.currentTurn++; this.startTurn(); }, 3000)`.
3. If `currentTurn === config.turns`:
   - Set `gamePhase = "finished"`.
   - Broadcast `game_over` with final `playerPoints`.
   - Close all connections after a short delay.

**On `onClose`** during game:
- Remove player from `players` and `playerPoints`.
- If `finishedInTurn` now covers all remaining players: call `endTurn()` early.

**On `onConnect`** during game (reconnect):
- After player sends `join`, broadcast current `game_state` so they re-sync.

### `broadcastGameState()`

```ts
broadcastGameState() {
  const payload: GameState = {
    phase: this.gamePhase!,
    currentTurn: this.currentTurn,
    totalTurns: this.config!.turns,
    turnRemainingMs: Math.max(0, this.turnEndsAt - Date.now()),
    finishedCount: this.finishedInTurn.size,
    totalPlayers: this.players.size,
    playerPoints: Object.fromEntries(this.playerPoints),
    config: this.config!,
  };
  this.room.broadcast(JSON.stringify({ type: "game_state", payload }));
}
```

## Client Architecture

### `app/jogo/[code]/game/GamePage.tsx` (full rewrite)

Client component. Connects to PartyKit on mount (same room code), sends `join`, handles `game_state` and `game_over` messages.

State:
```ts
const [gameState, setGameState] = useState<GameState | null>(null);
const [myId, setMyId] = useState<string | null>(null);
const [finished, setFinished] = useState(false);  // reset each turn
const [gameOver, setGameOver] = useState<Record<string, number> | null>(null);
```

On `welcome`: set `myId`.
On `game_state`: update `gameState`. If `phase` changed to `"playing"` and previous was `"between_turns"`: reset `finished` to false.
On `game_over`: set `gameOver`.

### UI Layout

```
┌─────────────────────────────────────────┐
│  TurnHeader (sticky top)                │
│  Turno 2/3  ·  ⏱ 0:45  ·  150 pts     │
├─────────────────────────────────────────┤
│                                         │
│  Voting area placeholder (flex-1,       │
│  overflow-y-auto, scrollable)           │
│                                         │
├─────────────────────────────────────────┤
│  TurnFooter (sticky bottom)             │
│  [Finalizar turno]  3 de 4 finalizaram  │
└─────────────────────────────────────────┘
```

Overlays (`fixed inset-0 z-50`):
- `BetweenTurnsOverlay` — when `phase === "between_turns"`, counts down 3s visually (uses `performance.now()` locally, same anti-timezone pattern)
- `GameOverScreen` — when `gameOver !== null`, shows "Fim de jogo!" + points table

### Components

| File | Props | Responsibility |
|------|-------|----------------|
| `components/game/TurnHeader.tsx` | `currentTurn, totalTurns, turnRemainingMs, myPoints` | Turn counter, countdown timer, points display |
| `components/game/TurnFooter.tsx` | `finished, finishedCount, totalPlayers, onFinish` | Finish button + "N de M finalizaram" |
| `components/game/BetweenTurnsOverlay.tsx` | `nextTurnIn: number` | "Próximo turno em X..." countdown |
| `components/game/GameOverScreen.tsx` | `playerPoints, players` | Ranking final |

**Timer in `TurnHeader`:** on each `game_state` received, compute `deadline = performance.now() + turnRemainingMs`. Run a `setInterval(100ms)` that recomputes remaining seconds and displays `MM:SS`. When `turnRemainingMs` arrives at 0 from the server, display 0:00.

**"Finalizar turno" button:** disabled after click. Re-enabled when `game_state` arrives with `phase === "playing"` and `currentTurn` incremented (new turn started).

## Data Flow Summary

```
Lobby → all ready → game_starting (5s) → GamePage connects to PartyKit
                                                   │
                                          Server: startGame() → startTurn(1)
                                                   │
                                          broadcast game_state (phase: playing)
                                                   │
                              ┌────────────────────┴───────────────────┐
                              │                                         │
                    Player clicks finish_turn                    Timer expires (server)
                    → Server records, broadcasts                → Server calls endTurn()
                    → If all done: endTurn()                            │
                              │                                         │
                              └────────────────┬────────────────────────┘
                                               │
                                          endTurn()
                                               │
                             ┌─────────────────┴──────────────────┐
                             │                                     │
                     more turns remain                      last turn
                     phase = between_turns                  broadcast game_over
                     broadcast game_state                   GameOverScreen
                     3s delay → startTurn(n+1)
```

## Edge Cases

- **Player disconnects mid-turn:** removed from `players` and `playerPoints`. If `finishedInTurn` now covers all remaining, `endTurn()` fires early.
- **Player reconnects mid-turn:** sends `join`, server broadcasts current `game_state` including `turnRemainingMs` — client re-syncs timer and state immediately.
- **All players disconnect:** `players` map empties, `onClose` cancels timers, room expires via existing inactivity timer.
- **Host disconnects:** no special behavior — game continues server-side. Another player could be promoted to host in a future spec.
- **`finish_turn` arrives after turn already ended:** ignored (sender not in current `finishedInTurn` set, which was cleared for the new turn).

## Files Touched

| File | Action |
|------|--------|
| `lib/lobbyTypes.ts` | Add `secondsPerTurn` to `RoomConfig`; add `finish_turn`, `game_state`, `game_over` messages |
| `lib/gameTypes.ts` | Create: `GamePhase`, `GameState` types |
| `party/index.ts` | Add game state fields, `startGame()`, `startTurn()`, `endTurn()`, `broadcastGameState()`, handle `finish_turn` |
| `components/home/OptionsPreview.tsx` | Add `secondsPerTurn` control (new card: Clock icon, 10–300s) |
| `components/game/ConfigPanel.tsx` | Add `secondsPerTurn` to editable and read-only views |
| `app/jogo/[code]/game/GamePage.tsx` | Full rewrite: PartyKit connection, game state, overlays |
| `components/game/TurnHeader.tsx` | Create: turn counter, timer, points |
| `components/game/TurnFooter.tsx` | Create: finish button + count |
| `components/game/BetweenTurnsOverlay.tsx` | Create: between-turns countdown |
| `components/game/GameOverScreen.tsx` | Create: final ranking |
