import { RoomCodeDisplay } from "./RoomCodeDisplay";
import { PlayerList } from "./PlayerList";
import { ReadyButton } from "./ReadyButton";
import { ConfigPanel } from "@/components/game/ConfigPanel";
import type { RoomConfig, ServerPlayer } from "@/lib/lobbyTypes";

type Props = {
  config: RoomConfig | null;
  players: ServerPlayer[];
  myId: string | null;
  myReady: boolean;
  isHost: boolean;
  onConfigChange: (config: RoomConfig) => void;
  onToggleReady: () => void;
};

export function LobbyPanel({ config, players, myId, myReady, isHost, onConfigChange, onToggleReady }: Props) {
  return (
    <section className="relative w-full max-w-5xl">
      <div className="greek-column left-column" aria-hidden />
      <div className="greek-column right-column" aria-hidden />

      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
        <RoomCodeDisplay />

        {config && (
          <div className="mt-6">
            <ConfigPanel config={config} editable={isHost} onChange={onConfigChange} />
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
