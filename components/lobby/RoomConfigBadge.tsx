import { Star, Timer } from "lucide-react";

type Props = {
  turns: number;
  pointsPerTurn: number;
};

export function RoomConfigBadge({ turns, pointsPerTurn }: Props) {
  const turnsLabel = turns === 1 ? "turno" : "turnos";
  const pointsLabel = pointsPerTurn === 1 ? "ponto/turno" : "pontos/turno";

  return (
    <>
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)]">
        <Timer className="h-3.5 w-3.5 shrink-0" />
        <span>{turns} {turnsLabel}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[rgb(216_183_108_/_0.9)]">
        <Star className="h-3.5 w-3.5 shrink-0" />
        <span>{pointsPerTurn} {pointsLabel}</span>
      </div>
    </>
  );
}
