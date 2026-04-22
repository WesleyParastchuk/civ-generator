import { RoomCodeDisplay } from "./RoomCodeDisplay";
import { RoomConfigBadge } from "./RoomConfigBadge";
import { PlayerList } from "./PlayerList";
import { ReadyButton } from "./ReadyButton";
import type { RoomConfig, ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  config: RoomConfig | null;
  players: ServerPlayer[];
  myId: string | null;
  myReady: boolean;
  onToggleReady: () => void;
};

export function LobbyPanel({ config, players, myId, myReady, onToggleReady }: Props) {
  return (
    <section className="relative w-full max-w-5xl">
      <div className="greek-column left-column" aria-hidden />
      <div className="greek-column right-column" aria-hidden />

      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
        <RoomCodeDisplay />

        {config && (
          <div className="mt-4 flex flex-wrap gap-2">
            <RoomConfigBadge turns={config.turns} pointsPerTurn={config.pointsPerTurn} />
          </div>
        )}

        <PlayerList players={players} myId={myId} className="mt-6" />

        <div className="mt-6">
          <ReadyButton ready={myReady} onToggle={onToggleReady} />
        </div>
      </div>
    </section>
  );
}
