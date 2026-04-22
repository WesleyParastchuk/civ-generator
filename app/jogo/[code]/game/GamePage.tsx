"use client";

export function GamePage({ code }: { code: string }) {
  return (
    <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-6 text-center shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur sm:p-10">
      <h1 className="font-[var(--font-cinzel)] text-3xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
        Votação
      </h1>
      <p className="mt-4 text-[rgb(206_189_156_/_0.7)]">
        Sala:{" "}
        <span className="font-mono font-semibold text-[rgb(227_200_140_/_0.92)]">{code}</span>
      </p>
    </div>
  );
}
