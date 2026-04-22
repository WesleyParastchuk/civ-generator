import { Swords, X } from "lucide-react";

type Props = {
  ready: boolean;
  onToggle: () => void;
};

export function ReadyButton({ ready, onToggle }: Props) {
  if (ready) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(190_153_81_/_0.42)] bg-[rgb(11_25_44_/_0.72)] px-6 py-4 text-lg font-semibold tracking-wide text-[rgb(206_189_156_/_0.8)] shadow-[0_4px_12px_rgb(3_8_16_/_0.3)] transition-all hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgb(247_227_179_/_0.95)] sm:w-auto"
        aria-label="Cancelar pronto"
      >
        <X className="h-5 w-5" />
        Cancelar pronto
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(225_194_127_/_0.62)] bg-[linear-gradient(180deg,_rgb(226_184_98_/_0.9)_0%,_rgb(160_116_38_/_0.95)_100%)] px-6 py-4 text-lg font-semibold tracking-wide text-[rgb(25_14_3_/_0.95)] shadow-[0_10px_24px_rgb(3_8_16_/_0.45)] transition-all hover:translate-y-[-2px] hover:brightness-105 hover:saturate-125 hover:shadow-[0_16px_30px_rgb(3_8_16_/_0.52)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgb(247_227_179_/_0.95)] sm:w-auto"
      aria-label="Marcar como pronto"
    >
      <Swords className="h-5 w-5 transition-transform group-hover:rotate-[-10deg]" />
      Pronto
    </button>
  );
}
