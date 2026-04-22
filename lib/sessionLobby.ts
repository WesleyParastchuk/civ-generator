import type { RoomConfig } from "./lobbyTypes";

export type LobbySession = {
  nickname: string;
  isHost: boolean;
  config: RoomConfig | null;
};

export function saveLobbySession(code: string, data: LobbySession): void {
  sessionStorage.setItem(`lobby-${code}`, JSON.stringify(data));
}

export function getLobbySession(code: string): LobbySession | null {
  const raw = sessionStorage.getItem(`lobby-${code}`);
  if (!raw) return null;
  return JSON.parse(raw) as LobbySession;
}

export function clearLobbySession(code: string): void {
  sessionStorage.removeItem(`lobby-${code}`);
}
