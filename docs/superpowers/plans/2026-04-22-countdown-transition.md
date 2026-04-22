# Countdown Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When all lobby players are ready, broadcast a server-driven 5-second countdown and navigate every client to the game screen.

**Architecture:** The PartyKit server detects when every player is ready and broadcasts `game_starting` with `remainingMs: 5000`. Each client starts a local monotonic countdown from the moment the message arrives (using `performance.now()` — immune to timezone and clock-skew differences), then navigates to `/jogo/[code]/game` independently. A full-screen `CountdownOverlay` component renders the countdown number.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, PartyKit (`partysocket/react`), Tailwind CSS v4, Lucide React.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/lobbyTypes.ts` | Modify | Add `game_starting` to `ServerMessage` union |
| `party/index.ts` | Modify | Broadcast `game_starting` when all players ready |
| `components/lobby/CountdownOverlay.tsx` | Create | Full-screen countdown overlay component |
| `app/jogo/[code]/LobbyPage.tsx` | Modify | Handle `game_starting`, run countdown, navigate |
| `app/jogo/[code]/game/page.tsx` | Create | Placeholder game screen |

---

### Task 1: Add `game_starting` to `ServerMessage` type

**Files:**
- Modify: `lib/lobbyTypes.ts`

- [ ] **Step 1: Add `game_starting` variant to `ServerMessage`**

Open `lib/lobbyTypes.ts`. The current `ServerMessage` ends at line 24. Replace the entire type:

```ts
// Mensagens servidor → cliente
export type ServerMessage =
  | { type: "welcome"; payload: { connectionId: string } }
  | { type: "room_update"; payload: { config: RoomConfig | null; players: ServerPlayer[] } }
  | { type: "room_expired" }
  | { type: "game_starting"; payload: { remainingMs: number } };
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (the new variant is not yet handled by the client — that's fine, TypeScript will not complain about unhandled union members in `onMessage`).

- [ ] **Step 3: Commit**

```bash
git add lib/lobbyTypes.ts
git commit -m "feat: add game_starting server message type"
```

---

### Task 2: Broadcast `game_starting` from PartyKit server

**Files:**
- Modify: `party/index.ts`

- [ ] **Step 1: Add all-ready check after `toggle_ready`**

In `party/index.ts`, the `toggle_ready` handler is at lines 28–33. Replace it with:

```ts
} else if (msg.type === "toggle_ready") {
  const player = this.players.get(sender.id);
  if (player) {
    player.ready = !player.ready;
    this.broadcast();
    const all = [...this.players.values()];
    if (all.length >= 1 && all.every((p) => p.ready)) {
      const startMsg: ServerMessage = {
        type: "game_starting",
        payload: { remainingMs: 5000 },
      };
      this.room.broadcast(JSON.stringify(startMsg));
    }
  }
}
```

`broadcast()` is called first so every client sees the final `room_update` (all shields green) before the countdown message arrives.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. The `ServerMessage` type already includes `game_starting` from Task 1.

- [ ] **Step 3: Manual smoke-test (dev server)**

```bash
npm run dev
```

Open two browser tabs to the same lobby URL. Set both to ready. Confirm the browser console shows no errors and the WebSocket connection stays open. (The countdown UI isn't wired yet — that's Task 4.)

- [ ] **Step 4: Commit**

```bash
git add party/index.ts
git commit -m "feat: broadcast game_starting when all players ready"
```

---

### Task 3: Create `CountdownOverlay` component

**Files:**
- Create: `components/lobby/CountdownOverlay.tsx`

- [ ] **Step 1: Create the component file**

```tsx
type Props = { seconds: number };

export function CountdownOverlay({ seconds }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgb(2_7_15_/_0.85)] backdrop-blur-sm">
      <p
        className="animate-pulse font-[var(--font-cinzel)] text-[10rem] font-bold leading-none text-[rgb(214_178_97_/_0.95)]"
        style={{ textShadow: "0 0 40px rgb(214 178 97 / 0.5)" }}
      >
        {seconds}
      </p>
      <p className="mt-4 font-[var(--font-cinzel)] text-lg uppercase tracking-widest text-[rgb(206_189_156_/_0.7)]">
        Preparando para o combate...
      </p>
    </div>
  );
}
```

Notes on design:
- `fixed inset-0 z-50` — sits above everything, including the lobby panel.
- `bg-[rgb(2_7_15_/_0.85)] backdrop-blur-sm` — semi-transparent dark overlay matching the Civ VI palette.
- `animate-pulse` — Tailwind utility that fades opacity in/out, giving the number a heartbeat rhythm.
- `font-[var(--font-cinzel)]` — uses the Cinzel heading font defined in `app/layout.tsx`.
- `text-[10rem]` — large enough to be dramatic on any screen.
- `textShadow` inline style — Tailwind v4 does not expose `text-shadow` utilities; use inline style.
- No `"use client"` directive needed — this is a pure presentational component rendered by `LobbyConnected` which is already client-side.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/lobby/CountdownOverlay.tsx
git commit -m "feat: add CountdownOverlay component"
```

---

### Task 4: Handle `game_starting` in `LobbyPage.tsx`

**Files:**
- Modify: `app/jogo/[code]/LobbyPage.tsx`

- [ ] **Step 1: Add imports**

At the top of `app/jogo/[code]/LobbyPage.tsx`, add two imports after the existing import block (currently ends at line 9):

```tsx
import { useRouter } from "next/navigation";
import { CountdownOverlay } from "@/components/lobby/CountdownOverlay";
```

Full import block after the change:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import usePartySocket from "partysocket/react";
import type { ClientMessage, RoomConfig, ServerMessage, ServerPlayer } from "@/lib/lobbyTypes";
import { getLobbySession, clearLobbySession } from "@/lib/sessionLobby";
import { NicknameGate } from "@/components/lobby/NicknameGate";
import { LobbyPanel } from "@/components/lobby/LobbyPanel";
import { CountdownOverlay } from "@/components/lobby/CountdownOverlay";
```

- [ ] **Step 2: Add countdown state and router to `LobbyConnected`**

Inside `LobbyConnected` (starts at line 22), add two lines after the existing `useState`/`useRef` declarations (currently lines 23–27):

```tsx
const [countdown, setCountdown] = useState<number | null>(null);
const router = useRouter();
```

Full state block after the change:

```tsx
const [players, setPlayers] = useState<ServerPlayer[]>([]);
const [config, setConfig] = useState<RoomConfig | null>(playerInfo.config);
const [myId, setMyId] = useState<string | null>(null);
const [expired, setExpired] = useState(false);
const [countdown, setCountdown] = useState<number | null>(null);
const joinSentRef = useRef(false);
const router = useRouter();
```

- [ ] **Step 3: Handle `game_starting` in `onMessage`**

Inside the `onMessage` handler (currently lines 45–55), add an `else if` branch for `game_starting` after the `room_expired` branch:

```tsx
onMessage(evt) {
  const msg = JSON.parse(evt.data as string) as ServerMessage;
  if (msg.type === "welcome") {
    setMyId(msg.payload.connectionId);
  } else if (msg.type === "room_update") {
    setPlayers(msg.payload.players);
    if (msg.payload.config) setConfig(msg.payload.config);
  } else if (msg.type === "room_expired") {
    setExpired(true);
  } else if (msg.type === "game_starting") {
    const deadline = performance.now() + msg.payload.remainingMs;
    setCountdown(5);
    const id = setInterval(() => {
      const remaining = Math.ceil((deadline - performance.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(id);
        router.push(`/jogo/${code}/game`);
      } else {
        setCountdown(remaining);
      }
    }, 100);
  }
},
```

Why `performance.now()` and not `Date.now()`: `performance.now()` is a monotonic clock local to the browser tab — it never jumps, is never adjusted by the OS, and is unaffected by timezone settings. Safe for ticking a countdown regardless of where in the world the player is.

Why 100 ms interval instead of 1000 ms: firing every 100 ms means the displayed number updates within 100 ms of the true second boundary — visually smooth. Firing at exactly 1 s intervals risks skipping a displayed number if the JS event loop is briefly busy.

- [ ] **Step 4: Render `CountdownOverlay` when countdown is active**

Inside `LobbyConnected`, add a conditional return before the `if (expired)` check (currently at line 63):

```tsx
if (countdown !== null) {
  return <CountdownOverlay seconds={countdown} />;
}

if (expired) {
  return (
    // ... existing expired JSX unchanged ...
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Verify ESLint passes**

```bash
npm run lint
```

Expected: no errors or warnings introduced by these changes.

- [ ] **Step 7: Commit**

```bash
git add app/jogo/\[code\]/LobbyPage.tsx
git commit -m "feat: countdown timer and navigation on game_starting"
```

---

### Task 5: Create placeholder game screen

**Files:**
- Create: `app/jogo/[code]/game/page.tsx`

- [ ] **Step 1: Create the game page**

```tsx
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
        <section className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 text-center shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
          <h1 className="font-[var(--font-cinzel)] text-3xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
            Jogo iniciado!
          </h1>
          <p className="mt-4 text-[rgb(206_189_156_/_0.7)]">
            Sala:{" "}
            <span className="font-mono font-semibold text-[rgb(227_200_140_/_0.92)]">
              {code}
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
```

This follows the exact same shell structure as `app/jogo/[code]/page.tsx` — `page-ornament`, `grain-overlay`, centered content in a `max-w-6xl` main. Uses `imperial-border` CSS class (defined in `globals.css`) for the gold-border panel. All text is in Brazilian Portuguese.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify ESLint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/jogo/[code]/game/page.tsx"
git commit -m "feat: placeholder game screen"
```

---

### Task 6: End-to-end manual test and deploy

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the happy path**

1. Open `http://localhost:3000` in two browser windows.
2. Create a room in window 1 (host). Copy the lobby URL.
3. Open the lobby URL in window 2. Enter a nickname.
4. Both windows should show 2 players in the list.
5. Click "Pronto" in window 1 → shield turns green for player 1.
6. Click "Pronto" in window 2 → both shields green.
7. **Expected**: countdown overlay appears in BOTH windows simultaneously, counting 5 → 4 → 3 → 2 → 1.
8. **Expected**: both windows navigate to `/jogo/<code>/game` and show "Jogo iniciado!" with the room code.

- [ ] **Step 3: Test with single player (development convenience)**

1. Open one lobby window. Click "Pronto".
2. **Expected**: countdown starts immediately (single player is enough per server logic).

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: build completes with no TypeScript or lint errors.

- [ ] **Step 5: Deploy to Vercel**

```bash
vercel --prod
```

- [ ] **Step 6: Deploy PartyKit server**

```bash
npx partykit deploy
```

- [ ] **Step 7: Smoke-test production**

Repeat Step 2 using the production Vercel URL (`https://civ-generator.vercel.app`). Confirm countdown and navigation work end-to-end on production.
