"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  code: string;
};

export function RoomCodeDisplay({ code }: Props) {
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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(206_189_156_/_0.7)]">
          Código da sala
        </p>
        <p className="mt-1 font-[var(--font-cinzel)] text-4xl font-bold tracking-[0.2em] text-[rgb(239_223_187_/_0.98)]">
          {code}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="game-control-button w-auto px-3 gap-1.5 text-xs font-semibold uppercase tracking-[0.1em]"
          aria-label="Copiar link da sala"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copiado!" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="game-control-button w-auto px-3 gap-1.5 text-xs font-semibold uppercase tracking-[0.1em]"
          aria-label="Compartilhar sala"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
      </div>
    </div>
  );
}
