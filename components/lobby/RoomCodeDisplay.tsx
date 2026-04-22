"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";

export function RoomCodeDisplay() {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Sala Civ VI", url }).catch(() => {});
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="group inline-flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(190_153_81_/_0.5)] bg-[rgb(11_25_44_/_0.8)] px-5 py-4 text-base font-semibold tracking-wide text-[rgb(227_200_140_/_0.92)] shadow-[0_4px_16px_rgb(2_7_15_/_0.35)] transition-all hover:border-[rgb(214_178_97_/_0.7)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(247_227_179_/_0.9)]"
        aria-label="Copiar link da sala"
      >
        <Copy className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
        {copied ? "Copiado!" : "Copiar link"}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="group inline-flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl border border-[rgb(225_194_127_/_0.62)] bg-[linear-gradient(180deg,_rgb(226_184_98_/_0.9)_0%,_rgb(160_116_38_/_0.95)_100%)] px-5 py-4 text-base font-semibold tracking-wide text-[rgb(25_14_3_/_0.95)] shadow-[0_8px_20px_rgb(3_8_16_/_0.4)] transition-all hover:brightness-105 hover:saturate-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(247_227_179_/_0.9)]"
        aria-label="Compartilhar sala"
      >
        <Share2 className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
        Compartilhar
      </button>
    </div>
  );
}
