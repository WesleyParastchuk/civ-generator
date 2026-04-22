"use client";

type Props = {
  pointsSpent: number;
  pointsPerTurn: number;
  votesThisTurn: number;
};

export function TurnFooter({ pointsSpent, pointsPerTurn, votesThisTurn }: Props) {
  if (pointsSpent === 0) return null;

  return (
    <div className="rounded-lg border border-[rgb(190_153_81_/_0.25)] bg-[rgb(10_20_34_/_0.6)] px-4 py-2.5 text-sm text-[rgb(206_189_156_/_0.7)]">
      Você gastou{" "}
      <span className="font-semibold text-[rgb(214_178_97_/_0.9)]">{pointsSpent}</span>
      {" "}de {pointsPerTurn} pontos
      {votesThisTurn > 0 && (
        <> em <span className="font-semibold text-[rgb(214_178_97_/_0.9)]">{votesThisTurn}</span> voto{votesThisTurn !== 1 ? "s" : ""}</>
      )}{" "}
      neste turno.
    </div>
  );
}
