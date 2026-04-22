"use client";

type Props = {
  nextTurn: number;
  totalTurns: number;
  isHost: boolean;
  onConfirm: () => void;
};

export function BetweenTurnsOverlay({ nextTurn, totalTurns, isHost, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(2_7_15_/_0.85)] backdrop-blur-sm">
      <div className="imperial-border mx-4 w-full max-w-sm rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.97)] p-8 text-center shadow-[0_24px_60px_rgb(2_7_15_/_0.7)]">
        <p className="font-[var(--font-cinzel)] text-xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
          Fim do turno
        </p>
        <p className="mt-3 text-[rgb(206_189_156_/_0.7)]">
          Os votos foram registrados. Prepare-se para o turno{" "}
          <span className="font-semibold text-[rgb(239_223_187_/_0.9)]">{nextTurn}</span>{" "}
          de {totalTurns}.
        </p>
        {isHost ? (
          <button
            type="button"
            onClick={onConfirm}
            className="game-control-button mt-6 h-auto w-full rounded-xl px-6 py-3 text-sm font-semibold"
          >
            Iniciar turno {nextTurn}
          </button>
        ) : (
          <p className="mt-6 text-sm text-[rgb(206_189_156_/_0.45)]">
            Aguardando host iniciar próximo turno…
          </p>
        )}
      </div>
    </div>
  );
}
