import { Crown, CheckCircle } from "lucide-react";
import type { ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  player: ServerPlayer;
  isMe: boolean;
};

export function PlayerCard({ player, isMe }: Props) {
  return (
    <div className="rounded-lg border border-[rgb(212_171_86_/_0.3)] bg-[rgb(19_47_77_/_0.5)] p-4 backdrop-blur">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-[var(--font-cinzel)] text-sm font-semibold tracking-wide text-[rgb(239_223_187_/_0.98)]">
              {player.nickname}
            </p>
            {player.isHost && (
              <Crown className="h-4 w-4 text-yellow-600" />
            )}
            {isMe && (
              <span className="rounded-full bg-[rgb(150_180_100_/_0.4)] px-2 py-0.5 text-xs font-semibold text-[rgb(180_210_130_/_0.95)]">
                Você
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[rgb(206_189_156_/_0.6)]">
            ID: {player.id.slice(0, 8)}...
          </p>
        </div>
        {player.ready && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
      </div>
    </div>
  );
}
