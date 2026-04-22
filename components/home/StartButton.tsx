import { Swords } from "lucide-react";

export function StartButton() {
  return (
    <button
      type="submit"
      className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(225_194_127_/_0.62)] bg-[linear-gradient(180deg,_rgb(226_184_98_/_0.9)_0%,_rgb(160_116_38_/_0.95)_100%)] px-6 py-4 text-lg font-semibold tracking-wide text-[rgb(25_14_3_/_0.95)] shadow-[0_10px_24px_rgb(3_8_16_/_0.45)] transition-all hover:translate-y-[-2px] hover:brightness-105 hover:saturate-125 hover:shadow-[0_16px_30px_rgb(3_8_16_/_0.52)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgb(247_227_179_/_0.95)] sm:w-auto"
      aria-label="Iniciar seleção da partida"
    >
      <Swords className="h-5 w-5 transition-transform group-hover:rotate-[-10deg]" />
      Iniciar seleção
    </button>
  );
}
