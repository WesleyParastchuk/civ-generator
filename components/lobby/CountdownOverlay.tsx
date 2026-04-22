type Props = { seconds: number };

export function CountdownOverlay({ seconds }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgb(2_7_15_/_0.85)] backdrop-blur-sm">
      <p
        className="animate-pulse font-[var(--font-cinzel)] text-[10rem] font-bold leading-none text-[rgb(214_178_97_/_0.95)]"
        style={{ textShadow: "0 0 40px rgb(214 178 97 / 0.5)" }}
      >
        {seconds}
      </p>
      <p className="mt-4 font-[var(--font-cinzel)] text-lg uppercase tracking-widest text-[rgb(206_189_156_/_0.7)]">
        Preparando para o combate...
      </p>
    </div>
  );
}
