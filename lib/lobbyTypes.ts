export type RoomConfig = {
  turns: number;
  pointsPerTurn: number;
};

export type Player = {
  nickname: string;
  ready: boolean;
  isHost: boolean;
};

export type ServerPlayer = Player & { id: string };

// Mensagens cliente → servidor
export type ClientMessage =
  | { type: "join"; payload: { nickname: string; isHost: boolean; config?: RoomConfig } }
  | { type: "toggle_ready" }
  | { type: "update_config"; payload: { config: RoomConfig } }
  | { type: "cast_vote"; payload: { scope: VoteScope; field: string; value: string | number | boolean } }
  | { type: "resolve_tie"; payload: { scope: VoteScope; field: string; value: string | number | boolean } }
  | { type: "ping" };

// Mensagens servidor → cliente
export type ServerMessage =
  | { type: "welcome"; payload: { connectionId: string } }
  | { type: "room_update"; payload: { config: RoomConfig | null; players: ServerPlayer[] } }
  | { type: "room_expired" }
  | { type: "game_starting"; payload: { remainingMs: number } }
  | { type: "voting_state"; payload: VotingState }
  | { type: "voting_snapshot_turn_end"; payload: { turn: number; ledger: TurnLedger } }
  | { type: "tie_break_required"; payload: { pendingTieBreaks: TieBreakPending[] } };

// ---------------------------------------------------------------------------
// Config schema types (for parsing config.json at runtime)
// ---------------------------------------------------------------------------

// A single option in a select field
export type SelectOption = {
  value: string;
  label: string;
  weight: number;
  default?: boolean;
};

// config.json field schemas
export type SelectFieldSchema = {
  type: "select";
  label: string;
  default: string | number | null;
  options?: SelectOption[];          // absent when leadersSource is used
  leadersSource?: string;            // "leaders.json" — options built from leaders data
  description?: string;
};

export type ToggleFieldSchema = {
  type: "toggle";
  label: string;
  default: boolean;
  weight: number;                    // cost per vote
  description?: string;
};

export type RangeFieldSchema = {
  type: "range";
  label: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
  description?: string;
};

export type ConfigFieldSchema = SelectFieldSchema | ToggleFieldSchema | RangeFieldSchema;

// Parsed config.json structure
export type GameConfigSchema = {
  matchConfig: Record<string, ConfigFieldSchema>;
  playerConfig: Record<string, ConfigFieldSchema>;
};

// ---------------------------------------------------------------------------
// Voting state types
// ---------------------------------------------------------------------------

// Scope: matchConfig fields or playerConfig fields for a specific player
export type VoteScope = "match" | { playerId: string };

// A single vote cast by one player
export type VoteCast = {
  voterId: string;        // connection id of voter
  scope: VoteScope;
  field: string;          // field key from config schema
  value: string | number | boolean;
  weight: number;         // points spent on this vote
};

// Per-turn ledger: accumulates all votes in the current turn
export type TurnLedger = {
  turn: number;
  votes: VoteCast[];
  spendByVoter: Record<string, number>;  // voterId → points spent this turn
};

// Accumulated vote totals per field option across all turns
// key: `${scope}:${field}:${value}` → total weight
export type VoteAccumulator = Record<string, number>;

// Tie-break: when final accumulation has tied options for a field
export type TieBreakPending = {
  scope: VoteScope;
  field: string;
  tiedValues: Array<string | number | boolean>;
  totalWeight: number;   // weight of each tied option
};

// Full voting state broadcast to clients
export type VotingState = {
  phase: "playing" | "between_turns" | "game_over";
  currentTurn: number;
  totalTurns: number;
  pointsPerTurn: number;
  // Points spent by each player in the current turn
  spendByVoter: Record<string, number>;
  // Votes cast in the current turn (visible to all)
  currentTurnVotes: VoteCast[];
  // Pending tie-breaks (only present in game_over phase)
  pendingTieBreaks?: TieBreakPending[];
  // Final resolved config (only present after all tie-breaks resolved)
  finalConfig?: FinalConfig;
};

// Final resolved configuration after all votes and tie-breaks
export type FinalConfig = {
  match: Record<string, string | number | boolean | null>;
  players: Record<string, Record<string, string | number | boolean | null>>;  // playerId → field → value
};
