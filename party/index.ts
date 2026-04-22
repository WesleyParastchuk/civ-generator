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
const BETWEEN_TURNS_MS = 5000;
const DEFAULT_TURN_DURATION_S = 120;

function scopeKey(scope: VoteScope): string {
  if (scope === "match") return "match";
  return `player|${scope.playerId}`;
}

function accumulatorKey(scope: VoteScope, field: string, value: string | number | boolean): string {
  return `${scopeKey(scope)}|${field}|${String(value)}`;
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

  // Players who clicked "Finalizar turno" this turn
  readyToEndTurn: Set<string> = new Set();

  // Countdown timers
  turnDeadline: number = 0; // UTC ms when current turn ends
  turnTimer: ReturnType<typeof setTimeout> | null = null;
  betweenTurnsDeadline: number = 0; // UTC ms when between-turns ends
  betweenTurnsTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(_conn: Party.Connection) { // eslint-disable-line @typescript-eslint/no-unused-vars
    this.resetTimer();
  }

  onMessage(message: string, sender: Party.Connection) {
    this.resetTimer();
    const msg = JSON.parse(message) as ClientMessage;

    if (msg.type === "join") {
      const { nickname, isHost, config } = msg.payload;
      if (isHost && config && this.gamePhase === "lobby") this.config = config;
      this.players.set(sender.id, { nickname, ready: false, isHost });
      const welcome: ServerMessage = { type: "welcome", payload: { connectionId: sender.id } };
      sender.send(JSON.stringify(welcome));
      this.broadcast();
      if (this.gamePhase !== "lobby") {
        const stateMsg = this.buildVotingStateMsg();
        if (stateMsg) sender.send(JSON.stringify(stateMsg));
      }

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
          this.gamePhase = "playing";
          this.currentTurn = 1;
          this.currentLedger = { turn: 1, votes: [], spendByVoter: {} };
          this.accumulator = {};
          this.pendingTieBreaks = [];
          this.finalConfig = null;
          this.readyToEndTurn = new Set();

          const startMsg: ServerMessage = {
            type: "game_starting",
            payload: { remainingMs: 5000 },
          };
          this.room.broadcast(JSON.stringify(startMsg));
          this.startTurnTimer();
          this.broadcastVotingState();
        }
      }

    } else if (msg.type === "cast_vote") {
      this.handleCastVote(sender, msg.payload);

    } else if (msg.type === "remove_vote") {
      this.handleRemoveVote(sender, msg.payload);

    } else if (msg.type === "end_turn") {
      this.handleEndTurn(sender);

    } else if (msg.type === "confirm_next_turn") {
      this.handleConfirmNextTurn(sender);

    } else if (msg.type === "resolve_tie") {
      this.handleResolveTie(sender, msg.payload);
    }
  }

  // Sets turnDeadline and schedules auto-end
  startTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    const durationMs = (this.config?.turnDurationSeconds ?? DEFAULT_TURN_DURATION_S) * 1000;
    this.turnDeadline = Date.now() + durationMs;
    this.turnTimer = setTimeout(() => {
      this.endTurn();
    }, durationMs);
  }

  // Transitions playing → between_turns (or game_over on last turn)
  endTurn() {
    if (this.gamePhase !== "playing") return;
    if (!this.config) return;
    if (this.turnTimer) { clearTimeout(this.turnTimer); this.turnTimer = null; }
    this.turnDeadline = 0;

    const ledger = this.currentLedger!;
    const snapshotMsg: ServerMessage = {
      type: "voting_snapshot_turn_end",
      payload: { turn: ledger.turn, ledger },
    };
    this.room.broadcast(JSON.stringify(snapshotMsg));

    if (this.currentTurn < this.config.turns) {
      this.gamePhase = "between_turns";
      this.betweenTurnsDeadline = Date.now() + BETWEEN_TURNS_MS;
      this.broadcastVotingState();
      // Auto-advance after 5s
      if (this.betweenTurnsTimer) clearTimeout(this.betweenTurnsTimer);
      this.betweenTurnsTimer = setTimeout(() => {
        this.startNextTurn();
      }, BETWEEN_TURNS_MS);
    } else {
      this.gamePhase = "game_over";
      this.betweenTurnsDeadline = 0;
      this.consolidateFinalConfig();
    }
  }

  startNextTurn() {
    if (this.betweenTurnsTimer) { clearTimeout(this.betweenTurnsTimer); this.betweenTurnsTimer = null; }
    if (this.gamePhase !== "between_turns") return;

    // Carry unspent points into next turn as negative initial spend
    const prevLedger = this.currentLedger!;
    const initialSpend: Record<string, number> = {};
    for (const [playerId] of this.players) {
      const unspent = this.config!.pointsPerTurn - (prevLedger.spendByVoter[playerId] ?? 0);
      if (unspent > 0) initialSpend[playerId] = -unspent;
    }

    this.currentTurn += 1;
    this.currentLedger = { turn: this.currentTurn, votes: [], spendByVoter: initialSpend };
    this.gamePhase = "playing";
    this.betweenTurnsDeadline = 0;
    this.readyToEndTurn = new Set();
    this.startTurnTimer();
    this.broadcastVotingState();
  }

  handleCastVote(
    sender: Party.Connection,
    payload: { scope: VoteScope; field: string; value: string | number | boolean; weight: number }
  ) {
    if (!this.config) return;
    if (this.gamePhase !== "playing") return;
    if (!this.players.has(sender.id)) return;

    const { scope, field, value, weight } = payload;
    if (weight < 1) return;

    if (scope !== "match") {
      if (!this.players.has(scope.playerId)) return;
    }

    const pointsPerTurn = this.config.pointsPerTurn;
    const ledger = this.currentLedger!;
    const spent = ledger.spendByVoter[sender.id] ?? 0;
    if (pointsPerTurn - spent < weight) return;

    const vote: VoteCast = { voterId: sender.id, scope, field, value, weight };
    ledger.votes.push(vote);
    ledger.spendByVoter[sender.id] = spent + weight;

    const key = accumulatorKey(scope, field, value);
    this.accumulator[key] = (this.accumulator[key] ?? 0) + weight;

    this.broadcastVotingState();
  }

  handleRemoveVote(
    sender: Party.Connection,
    payload: { scope: VoteScope; field: string; value: string | number | boolean }
  ) {
    if (this.gamePhase !== "playing") return;
    if (!this.players.has(sender.id)) return;

    const { scope, field, value } = payload;
    const ledger = this.currentLedger!;

    // Find last matching vote by this player
    const idx = [...ledger.votes].reverse().findIndex(
      (v) =>
        v.voterId === sender.id &&
        v.field === field &&
        String(v.value) === String(value) &&
        (scope === "match"
          ? v.scope === "match"
          : v.scope !== "match" && v.scope.playerId === (scope as { playerId: string }).playerId)
    );
    if (idx === -1) return;

    const realIdx = ledger.votes.length - 1 - idx;
    const removed = ledger.votes[realIdx];
    ledger.votes.splice(realIdx, 1);
    ledger.spendByVoter[sender.id] = Math.max(0, (ledger.spendByVoter[sender.id] ?? 0) - removed.weight);

    const key = accumulatorKey(scope, field, value);
    this.accumulator[key] = Math.max(0, (this.accumulator[key] ?? 0) - removed.weight);
    if (this.accumulator[key] === 0) delete this.accumulator[key];

    this.broadcastVotingState();
  }

  handleEndTurn(sender: Party.Connection) {
    if (!this.players.has(sender.id)) return;
    if (this.gamePhase !== "playing") return;
    this.readyToEndTurn.add(sender.id);
    if (this.readyToEndTurn.size >= this.players.size) {
      this.endTurn();
    } else {
      this.broadcastVotingState();
    }
  }

  handleConfirmNextTurn(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player?.isHost) return;
    if (this.gamePhase !== "between_turns") return;
    this.startNextTurn();
  }

  consolidateFinalConfig() {
    const connectedPlayerIds = [...this.players.keys()];

    const matchResult: Record<string, string | number | boolean | null> = {};
    const playersResult: Record<string, Record<string, string | number | boolean | null>> = {};
    const newPendingTieBreaks: TieBreakPending[] = [];

    const matchFields = new Set<string>();
    const playerFields = new Map<string, Set<string>>();

    for (const key of Object.keys(this.accumulator)) {
      if (key.startsWith("match|")) {
        const rest = key.slice("match|".length);
        const pipeIdx = rest.indexOf("|");
        if (pipeIdx !== -1) matchFields.add(rest.slice(0, pipeIdx));
      } else if (key.startsWith("player|")) {
        const rest = key.slice("player|".length);
        const parts = rest.split("|");
        if (parts.length >= 3) {
          const playerId = parts[0];
          const field = parts[1];
          if (!playerFields.has(playerId)) playerFields.set(playerId, new Set());
          playerFields.get(playerId)!.add(field);
        }
      }
    }

    for (const field of matchFields) {
      const { winner, tied, tiedValues, maxWeight } = this.resolveField("match", field);
      if (tied) {
        newPendingTieBreaks.push({ scope: "match", field, tiedValues, totalWeight: maxWeight });
        matchResult[field] = null;
      } else {
        matchResult[field] = winner;
      }
    }

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

    // Compute runner-up civilization per player
    const runnerUpCivilization: Record<string, string | number | boolean | null> = {};
    for (const playerId of connectedPlayerIds) {
      const second = this.resolveRunnerUp({ playerId }, "civilization");
      if (second !== null) runnerUpCivilization[playerId] = second;
    }

    this.finalConfig = { match: matchResult, players: playersResult, runnerUpCivilization };
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
    const prefix = `${scopeKey(scope)}|${field}|`;
    let maxWeight = 0;
    const candidateMap = new Map<string, number>();

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
      return { winner: coerceValue(winners[0]), tied: false, tiedValues: [], maxWeight };
    }

    return { winner: null, tied: true, tiedValues: winners.map(coerceValue), maxWeight };
  }

  resolveRunnerUp(scope: VoteScope, field: string): string | number | boolean | null {
    const prefix = `${scopeKey(scope)}|${field}|`;
    const candidates: Array<[string, number]> = [];
    for (const [key, weight] of Object.entries(this.accumulator)) {
      if (key.startsWith(prefix)) candidates.push([key.slice(prefix.length), weight]);
    }
    candidates.sort((a, b) => b[1] - a[1]);
    if (candidates.length < 2) return null;
    return coerceValue(candidates[1][0]);
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
    const idx = this.pendingTieBreaks.findIndex(
      (tb) => scopeKey(tb.scope) === scopeKey(scope) && tb.field === field
    );
    if (idx === -1) return;

    const pending = this.pendingTieBreaks[idx];
    if (!pending.tiedValues.some((v) => String(v) === String(value))) return;

    if (!this.finalConfig) return;

    if (scope === "match") {
      this.finalConfig.match[field] = value;
    } else {
      const { playerId } = scope;
      if (!this.finalConfig.players[playerId]) this.finalConfig.players[playerId] = {};
      this.finalConfig.players[playerId][field] = value;
    }

    this.pendingTieBreaks.splice(idx, 1);
    this.broadcastVotingState();
  }

  buildVotingStateMsg(): ServerMessage | null {
    if (this.gamePhase === "lobby" || !this.config) return null;
    const ledger = this.currentLedger;
    const state: VotingState = {
      phase: this.gamePhase as VotingState["phase"],
      currentTurn: this.currentTurn,
      totalTurns: this.config.turns,
      pointsPerTurn: this.config.pointsPerTurn,
      turnDeadline: this.gamePhase === "playing" ? this.turnDeadline : 0,
      betweenTurnsDeadline: this.gamePhase === "between_turns" ? this.betweenTurnsDeadline : 0,
      spendByVoter: ledger?.spendByVoter ?? {},
      currentTurnVotes: ledger?.votes ?? [],
      readyToEndCount: this.readyToEndTurn.size,
      totalPlayers: this.players.size,
      ...(this.pendingTieBreaks.length > 0 ? { pendingTieBreaks: this.pendingTieBreaks } : {}),
      ...(this.finalConfig && this.pendingTieBreaks.length === 0 ? { finalConfig: this.finalConfig } : {}),
    };
    return { type: "voting_state", payload: state };
  }

  broadcastVotingState() {
    const msg = this.buildVotingStateMsg();
    if (msg) this.room.broadcast(JSON.stringify(msg));
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

function coerceValue(raw: string): string | number | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (!isNaN(n) && raw.trim() !== "") return n;
  return raw;
}
