import type * as Party from "partykit/server";
import type {
  ClientMessage,
  FinalConfig,
  RoomConfig,
  ServerMessage,
  ServerPlayer,
  TieBreakPending,
  TurnLedger,
  VoteAccumulator,
  VoteCast,
  VoteScope,
  VotingState,
} from "../lib/lobbyTypes";

const INACTIVITY_MS = 30 * 60 * 1000;

function scopeKey(scope: VoteScope): string {
  if (scope === "match") return "match";
  return `player:${scope.playerId}`;
}

function accumulatorKey(scope: VoteScope, field: string, value: string | number | boolean): string {
  return `${scopeKey(scope)}:${field}:${String(value)}`;
}

export default class LobbyServer implements Party.Server {
  players: Map<string, { nickname: string; ready: boolean; isHost: boolean }> = new Map();
  config: RoomConfig | null = null;
  cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  // Game phase
  gamePhase: "lobby" | "playing" | "between_turns" | "game_over" = "lobby";
  currentTurn: number = 0;

  // Per-turn ledger (reset each turn)
  currentLedger: TurnLedger | null = null;

  // Global vote accumulator across all turns
  accumulator: VoteAccumulator = {};

  // Pending tie-breaks
  pendingTieBreaks: TieBreakPending[] = [];

  // Final resolved config
  finalConfig: FinalConfig | null = null;

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

    } else if (msg.type === "update_config") {
      const player = this.players.get(sender.id);
      if (player?.isHost) {
        this.config = msg.payload.config;
        this.broadcast();
      }

    } else if (msg.type === "toggle_ready") {
      const player = this.players.get(sender.id);
      if (player) {
        player.ready = !player.ready;
        this.broadcast();
        const all = [...this.players.values()];
        if (all.length >= 1 && all.every((p) => p.ready)) {
          // Start the game
          this.gamePhase = "playing";
          this.currentTurn = 1;
          this.currentLedger = { turn: 1, votes: [], spendByVoter: {} };
          this.accumulator = {};
          this.pendingTieBreaks = [];
          this.finalConfig = null;

          const startMsg: ServerMessage = {
            type: "game_starting",
            payload: { remainingMs: 5000 },
          };
          this.room.broadcast(JSON.stringify(startMsg));
          this.broadcastVotingState();
        }
      }

    } else if (msg.type === "cast_vote") {
      this.handleCastVote(sender, msg.payload);

    } else if (msg.type === "end_turn") {
      this.handleEndTurn(sender);

    } else if (msg.type === "confirm_next_turn") {
      this.handleConfirmNextTurn(sender);

    } else if (msg.type === "resolve_tie") {
      this.handleResolveTie(sender, msg.payload);
    }
    // ping: timer already reset above, nothing else to do
  }

  handleCastVote(
    sender: Party.Connection,
    payload: { scope: VoteScope; field: string; value: string | number | boolean; weight: number }
  ) {
    // Validate phase
    if (this.gamePhase !== "playing") return;

    // Validate sender is a connected player
    if (!this.players.has(sender.id)) return;

    const { scope, field, value, weight } = payload;

    // Validate weight
    if (weight < 1) return;

    // Validate scope: if playerConfig scope, that player must be connected
    if (scope !== "match") {
      if (!this.players.has(scope.playerId)) return;
    }

    // Validate player has enough points remaining this turn
    const pointsPerTurn = this.config?.pointsPerTurn ?? 0;
    const ledger = this.currentLedger!;
    const spent = ledger.spendByVoter[sender.id] ?? 0;
    if (pointsPerTurn - spent < weight) return;

    // Build VoteCast record
    const vote: VoteCast = {
      voterId: sender.id,
      scope,
      field,
      value,
      weight,
    };

    // Add to ledger
    ledger.votes.push(vote);
    ledger.spendByVoter[sender.id] = spent + weight;

    // Add to accumulator
    const key = accumulatorKey(scope, field, value);
    this.accumulator[key] = (this.accumulator[key] ?? 0) + weight;

    // Broadcast updated voting state
    this.broadcastVotingState();
  }

  handleEndTurn(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player?.isHost) return;
    if (this.gamePhase !== "playing") return;
    if (!this.config) return;

    const ledger = this.currentLedger!;

    // Broadcast the turn snapshot
    const snapshotMsg: ServerMessage = {
      type: "voting_snapshot_turn_end",
      payload: { turn: ledger.turn, ledger },
    };
    this.room.broadcast(JSON.stringify(snapshotMsg));

    if (this.currentTurn < this.config.turns) {
      // Move to between_turns; wait for confirm_next_turn
      this.gamePhase = "between_turns";
      this.broadcastVotingState();
    } else {
      // Last turn: consolidate and move to game_over
      this.gamePhase = "game_over";
      this.consolidateFinalConfig();
    }
  }

  handleConfirmNextTurn(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player?.isHost) return;
    if (this.gamePhase !== "between_turns") return;

    this.currentTurn += 1;
    this.currentLedger = { turn: this.currentTurn, votes: [], spendByVoter: {} };
    this.gamePhase = "playing";
    this.broadcastVotingState();
  }

  consolidateFinalConfig() {
    const connectedPlayerIds = [...this.players.keys()];

    // Build finalConfig with winners
    const matchResult: Record<string, string | number | boolean | null> = {};
    const playersResult: Record<string, Record<string, string | number | boolean | null>> = {};
    const newPendingTieBreaks: TieBreakPending[] = [];

    // Gather all unique scope:field combinations from accumulator
    const matchFields = new Set<string>();
    const playerFields = new Map<string, Set<string>>(); // playerId → Set<field>

    for (const key of Object.keys(this.accumulator)) {
      // key format: "match:field:value" or "player:playerId:field:value"
      if (key.startsWith("match:")) {
        const rest = key.slice("match:".length);
        // rest = "field:value" — field may not contain ":"? We store as field:String(value)
        // We need to extract field. Since field could have colons theoretically,
        // we track the field names that were actually voted on.
        // The safest approach: re-parse by splitting at most 2 parts after "match:"
        const colonIdx = rest.indexOf(":");
        if (colonIdx !== -1) {
          matchFields.add(rest.slice(0, colonIdx));
        }
      } else if (key.startsWith("player:")) {
        const rest = key.slice("player:".length);
        // rest = "playerId:field:value"
        // playerId could theoretically contain colons but connection IDs typically don't
        // Split into at most 3 parts
        const parts = rest.split(":");
        if (parts.length >= 3) {
          const playerId = parts[0];
          const field = parts[1];
          if (!playerFields.has(playerId)) playerFields.set(playerId, new Set());
          playerFields.get(playerId)!.add(field);
        }
      }
    }

    // Resolve match fields
    for (const field of matchFields) {
      const { winner, tied, tiedValues, maxWeight } = this.resolveField("match", field);
      if (tied) {
        newPendingTieBreaks.push({ scope: "match", field, tiedValues, totalWeight: maxWeight });
        matchResult[field] = null;
      } else {
        matchResult[field] = winner;
      }
    }

    // Resolve player fields — only for currently connected players
    for (const playerId of connectedPlayerIds) {
      playersResult[playerId] = {};
      const fields = playerFields.get(playerId) ?? new Set<string>();
      for (const field of fields) {
        const scope: VoteScope = { playerId };
        const { winner, tied, tiedValues, maxWeight } = this.resolveField(scope, field);
        if (tied) {
          newPendingTieBreaks.push({ scope, field, tiedValues, totalWeight: maxWeight });
          playersResult[playerId][field] = null;
        } else {
          playersResult[playerId][field] = winner;
        }
      }
    }

    this.finalConfig = { match: matchResult, players: playersResult };
    this.pendingTieBreaks = newPendingTieBreaks;

    if (newPendingTieBreaks.length > 0) {
      const tieMsg: ServerMessage = {
        type: "tie_break_required",
        payload: { pendingTieBreaks: newPendingTieBreaks },
      };
      this.room.broadcast(JSON.stringify(tieMsg));
    }

    this.broadcastVotingState();
  }

  resolveField(
    scope: VoteScope,
    field: string
  ): {
    winner: string | number | boolean | null;
    tied: boolean;
    tiedValues: Array<string | number | boolean>;
    maxWeight: number;
  } {
    // Find all accumulator entries for this scope+field
    const prefix = `${scopeKey(scope)}:${field}:`;
    let maxWeight = 0;
    const candidateMap = new Map<string, number>(); // rawValue → weight

    for (const [key, weight] of Object.entries(this.accumulator)) {
      if (key.startsWith(prefix)) {
        const rawValue = key.slice(prefix.length);
        candidateMap.set(rawValue, weight);
        if (weight > maxWeight) maxWeight = weight;
      }
    }

    if (candidateMap.size === 0) {
      return { winner: null, tied: false, tiedValues: [], maxWeight: 0 };
    }

    const winners: string[] = [];
    for (const [rawValue, weight] of candidateMap) {
      if (weight === maxWeight) winners.push(rawValue);
    }

    if (winners.length === 1) {
      // Try to coerce back to original type — stored as String(value)
      const raw = winners[0];
      const coerced = coerceValue(raw);
      return { winner: coerced, tied: false, tiedValues: [], maxWeight };
    }

    // Tie
    const tiedValues = winners.map(coerceValue);
    return { winner: null, tied: true, tiedValues, maxWeight };
  }

  handleResolveTie(
    sender: Party.Connection,
    payload: { scope: VoteScope; field: string; value: string | number | boolean }
  ) {
    const player = this.players.get(sender.id);
    if (!player?.isHost) return;
    if (this.gamePhase !== "game_over") return;
    if (this.pendingTieBreaks.length === 0) return;

    const { scope, field, value } = payload;

    // Find matching tie-break
    const idx = this.pendingTieBreaks.findIndex(
      (tb) => scopeKey(tb.scope) === scopeKey(scope) && tb.field === field
    );
    if (idx === -1) return;

    // Apply the resolved value to finalConfig
    if (!this.finalConfig) return;

    if (scope === "match") {
      this.finalConfig.match[field] = value;
    } else {
      const { playerId } = scope;
      if (!this.finalConfig.players[playerId]) {
        this.finalConfig.players[playerId] = {};
      }
      this.finalConfig.players[playerId][field] = value;
    }

    // Remove resolved tie-break
    this.pendingTieBreaks.splice(idx, 1);

    this.broadcastVotingState();
  }

  broadcastVotingState() {
    if (!this.config) return;
    const ledger = this.currentLedger;

    const state: VotingState = {
      phase: this.gamePhase === "lobby" ? "playing" : (this.gamePhase as VotingState["phase"]),
      currentTurn: this.currentTurn,
      totalTurns: this.config.turns,
      pointsPerTurn: this.config.pointsPerTurn,
      spendByVoter: ledger?.spendByVoter ?? {},
      currentTurnVotes: ledger?.votes ?? [],
      ...(this.pendingTieBreaks.length > 0 ? { pendingTieBreaks: this.pendingTieBreaks } : {}),
      ...(this.finalConfig && this.pendingTieBreaks.length === 0 ? { finalConfig: this.finalConfig } : {}),
    };

    const msg: ServerMessage = { type: "voting_state", payload: state };
    this.room.broadcast(JSON.stringify(msg));
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Attempt to coerce a raw string (from accumulator key) back to its original type. */
function coerceValue(raw: string): string | number | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (!isNaN(n) && raw.trim() !== "") return n;
  return raw;
}
