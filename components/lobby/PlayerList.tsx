import { PlayerCard } from "./PlayerCard";
import type { ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  players: ServerPlayer[];
  myId: string | null;
  className?: string;
};

export function PlayerList({ players, myId, className = "" }: Props) {
  return (
    <div className={className}>
      <h2 className="font-[var(--font-cinzel)] text-lg tracking-wide text-[rgb(239_223_187_/_0.98)]">
        Jogadores
        <span className="ml-2 font-sans text-sm font-normal text-[rgb(206_189_156_/_0.6)]">
          ({players.length})
        </span>
      </h2>
      {players.length === 0 ? (
        <p className="mt-3 text-sm text-[rgb(206_189_156_/_0.55)]">
          Aguardando jogadores...
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={player.id === myId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
