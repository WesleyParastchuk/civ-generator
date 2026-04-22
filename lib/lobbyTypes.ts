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
  | { type: "ping" };

// Mensagens servidor → cliente
export type ServerMessage =
  | { type: "welcome"; payload: { connectionId: string } }
  | { type: "room_update"; payload: { config: RoomConfig | null; players: ServerPlayer[] } }
  | { type: "room_expired" };
