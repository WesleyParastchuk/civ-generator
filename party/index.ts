import type * as Party from "partykit/server";
import type { ClientMessage, RoomConfig, ServerMessage, ServerPlayer } from "../lib/lobbyTypes";

const INACTIVITY_MS = 30 * 60 * 1000;

export default class LobbyServer implements Party.Server {
  players: Map<string, { nickname: string; ready: boolean; isHost: boolean }> = new Map();
  config: RoomConfig | null = null;
  cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(_conn: Party.Connection) { // eslint-disable-line @typescript-eslint/no-unused-vars
    this.resetTimer();
  }

  onMessage(message: string, sender: Party.Connection) {
    this.resetTimer();
    const msg = JSON.parse(message) as ClientMessage;

    if (msg.type === "join") {
      const { nickname, isHost, config } = msg.payload;
      if (isHost && config) this.config = config;
      this.players.set(sender.id, { nickname, ready: false, isHost });
      const welcome: ServerMessage = { type: "welcome", payload: { connectionId: sender.id } };
      sender.send(JSON.stringify(welcome));
      this.broadcast();
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
    // ping: timer already reset above, nothing else to do
  }

  onClose(conn: Party.Connection) {
    this.players.delete(conn.id);
    if (this.players.size === 0) {
      if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
      return;
    }
    this.broadcast();
    this.resetTimer();
  }

  broadcast() {
    const players: ServerPlayer[] = Array.from(this.players.entries()).map(
      ([id, p]) => ({ id, ...p })
    );
    const msg: ServerMessage = {
      type: "room_update",
      payload: { config: this.config, players },
    };
    this.room.broadcast(JSON.stringify(msg));
  }

  resetTimer() {
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
    this.cleanupTimer = setTimeout(() => {
      const msg: ServerMessage = { type: "room_expired" };
      this.room.broadcast(JSON.stringify(msg));
      for (const conn of this.room.getConnections()) {
        conn.close();
      }
    }, INACTIVITY_MS);
  }
}

LobbyServer satisfies Party.Worker;
