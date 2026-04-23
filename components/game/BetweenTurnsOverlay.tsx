"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { CountdownShell, CountdownNumber } from "@/components/game/CountdownDisplay";
import { generateRumors } from "@/lib/rumors";
import type { VoteCast, ServerPlayer, GameConfigSchema } from "@/lib/lobbyTypes";
import type { LeaderEntry } from "@/components/game/VotingField";

type Props = {
  nextTurn: number;
  totalTurns: number;
  betweenDeadline: number;
  // Rumor data
  votes: VoteCast[];
  spendByVoter: Record<string, number>;
  myId: string;
  players: ServerPlayer[];
  configSchema: GameConfigSchema | null;
  leaders: LeaderEntry[];
  pointsPerTurn: number;
};

export function BetweenTurnsOverlay({
  nextTurn,
  totalTurns,
  betweenDeadline,
  votes,
  spendByVoter,
  myId,
  players,
  configSchema,
  leaders,
  pointsPerTurn,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((betweenDeadline - Date.now()) / 1000)),
  );

  useEffect(() => {
    const update = () =>
      setSecondsLeft(Math.max(0, Math.ceil((betweenDeadline - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [betweenDeadline]);

  // Generate once per between-turns phase
  const rumors = useMemo(
    () => generateRumors({ votes, spendByVoter, myId, players, configSchema, leaders, pointsPerTurn }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[rgb(2_7_15_/_0.92)] backdrop-blur-sm px-6">
      {/* Countdown */}
      <div className="flex flex-col items-center">
        <CountdownNumber key={secondsLeft} value={secondsLeft} animated={secondsLeft <= 3} />
        <p className="mt-4 font-[var(--font-cinzel)] text-lg uppercase tracking-widest text-[rgb(206_189_156_/_0.65)]">
          Preparando turno {nextTurn} de {totalTurns}...
        </p>
      </div>

      {/* Rumors */}
      {rumors.length > 0 && (
        <div
          className="w-full max-w-md"
          style={{ animation: "game-rise-in 600ms 400ms ease-out both" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <ScrollText className="h-3.5 w-3.5 text-[rgb(214_178_97_/_0.7)]" />
            <span className="font-[var(--font-cinzel)] text-xs uppercase tracking-widest text-[rgb(214_178_97_/_0.7)]">
              Rumores
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-[rgb(214_178_97_/_0.4)] to-transparent" />
          </div>
          <div className="space-y-2">
            {rumors.map((rumor, i) => (
              <div
                key={i}
                className="rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.7)] px-4 py-3"
                style={{ animation: `game-rise-in 500ms ${300 + i * 150}ms ease-out both` }}
              >
                <p className="text-sm italic text-[rgb(206_189_156_/_0.85)]">
                  &ldquo;{rumor}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
