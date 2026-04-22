import { Crown, Hourglass, ShieldCheck } from "lucide-react";
import type { ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  player: ServerPlayer;
  isMe: boolean;
};

export function PlayerCard({ player, isMe }: Props) {
  return (
    <article
      className={[
        "game-card rounded-xl border p-4 shadow-[inset_0_0_0_1px_rgb(255_220_150_/_0.06)] transition-all",
        player.ready
          ? "border-[rgb(214_178_97_/_0.65)] bg-[rgb(14_32_54_/_0.88)]"
          : "border-[rgb(190_153_81_/_0.25)] bg-[rgb(11_25_44_/_0.72)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {player.isHost && (
            <Crown className="h-3.5 w-3.5 shrink-0 text-[rgb(233_205_141_/_0.9)]" />
          )}
          <span className="truncate font-semibold text-[rgb(239_223_187_/_0.95)]">
            {player.nickname}
            {isMe && (
              <span className="ml-1.5 text-xs font-normal text-[rgb(206_189_156_/_0.6)]">(você)</span>
            )}
          </span>
        </div>
        {player.ready ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-[rgb(160_210_130_/_0.9)]" />
        ) : (
          <Hourglass className="h-5 w-5 shrink-0 text-[rgb(206_189_156_/_0.5)]" />
        )}
      </div>
      <p className={[
        "mt-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
        player.ready
          ? "text-[rgb(160_210_130_/_0.85)]"
          : "text-[rgb(206_189_156_/_0.55)]",
      ].join(" ")}>
        {player.ready ? "Pronto" : "Aguardando"}
      </p>
    </article>
  );
}
