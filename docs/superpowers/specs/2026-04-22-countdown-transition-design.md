# Countdown Transition Design

## Goal

When all players in a lobby are ready, show a synchronized 5-second countdown overlay, then navigate every client to the game screen.

## Architecture

### Server-side (`party/index.ts`)

After any `toggle_ready` message, the server checks: if every player is ready and there is at least one player, it broadcasts `game_starting` with `remainingMs: 5000`. No absolute timestamps are used — the client starts its own monotonic countdown upon receiving the message, making the feature immune to timezone differences and cross-machine clock skew.

The server does not need to track "game started" state explicitly. If a late-joining client connects after `game_starting` was broadcast, they will miss the message and remain on the lobby screen; this is acceptable since late joins are unusual and the game screen will be navigated to by active clients only.

### Client-side (`LobbyPage.tsx` / `LobbyConnected`)

On receiving `game_starting`:
1. Record `deadline = performance.now() + remainingMs`.
2. Set `countdown` state to `5`.
3. Start a `setInterval` (100ms tick) that recomputes `Math.ceil((deadline - performance.now()) / 1000)` and updates state.
4. When the interval produces `<= 0`, clear it and call `router.push(\`/jogo/${code}/game\`)`.

`performance.now()` is monotonic (never goes backwards, unaffected by system clock adjustments) and is local-only — no cross-machine comparison.

### Countdown overlay (`components/lobby/CountdownOverlay.tsx`)

Rendered on top of `LobbyPanel` when `countdown !== null`. Full-screen semi-transparent overlay with:
- Large gold number (Cinzel font, ~10rem) centered.
- Subtitle: "Preparando para o combate...".
- CSS `animate-pulse` on the number for visual rhythm.
- Uses `z-50` to sit above all lobby content.

### Game screen (`app/jogo/[code]/game/page.tsx`)

Placeholder page for now. Shows:
- "Jogo iniciado!" heading.
- Room code.
- Same Civ VI visual theme (dark blue panel, gold text, `imperial-border`).

The actual mini-game content will be designed in a separate spec.

## Data flow

```
All players toggle ready
       │
       ▼
party/index.ts: all.every(p => p.ready)
       │
       ▼
broadcast: { type: "game_starting", payload: { remainingMs: 5000 } }
       │
       ├──▶ Client A receives → starts countdown from performance.now()
       ├──▶ Client B receives → starts countdown from performance.now()
       └──▶ Client C receives → starts countdown from performance.now()
                                        │
                                        ▼ (≈5 s later, each client independently)
                             router.push(`/jogo/${code}/game`)
```

## Type changes (`lib/lobbyTypes.ts`)

```ts
// ServerMessage gains:
| { type: "game_starting"; payload: { remainingMs: number } }
```

## Files touched

| File | Change |
|------|--------|
| `lib/lobbyTypes.ts` | Add `game_starting` to `ServerMessage` |
| `party/index.ts` | Broadcast `game_starting` when all ready |
| `app/jogo/[code]/LobbyPage.tsx` | Handle `game_starting`, manage countdown state, navigate |
| `components/lobby/CountdownOverlay.tsx` | New: overlay component |
| `app/jogo/[code]/game/page.tsx` | New: placeholder game page |

## Edge cases

- **Player unreadies after countdown starts**: the countdown has already been sent; it is not cancelled. This is intentional — once everyone was ready, the game begins.
- **Single player**: minimum of 1 player is enough to trigger (useful for testing). Can be raised to 2 later.
- **Player disconnects after countdown**: their client won't navigate, which is fine. Remaining clients navigate normally.
