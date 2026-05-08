"use client";

import { useRef, useState } from "react";

type Props = {
  text: string;
};

type TooltipPos = { top?: number; bottom?: number; left: number };

export function HelpTooltip({ text }: Props) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const tooltipW = 13 * 16; // 13rem
    const gap = 12;
    const left = r.right + gap + tooltipW > window.innerWidth
      ? r.left - tooltipW - gap
      : r.right + gap;
    const midScreen = window.innerHeight / 2;
    const p: TooltipPos = r.top > midScreen
      ? { bottom: window.innerHeight - r.bottom, left }
      : { top: r.top, left };
    setPos(p);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        style={{
          width: "1.375rem",
          height: "1.375rem",
          borderRadius: "999px",
          border: "1px solid rgba(214,178,97,0.55)",
          background: "rgba(11,25,44,0.5)",
          color: "rgb(218,183,103)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          lineHeight: "1.375rem",
          textAlign: "center",
          display: "block",
          flexShrink: 0,
          cursor: "default",
        }}
      >
        ?
      </button>

      {pos && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            zIndex: 9999,
            width: "13rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(214,178,97,0.3)",
            background: "linear-gradient(135deg, rgba(16,42,73,0.98), rgba(8,18,33,0.98))",
            boxShadow: "rgba(0,0,0,0.5) 0 8px 32px",
            padding: "0.875rem",
            color: "rgb(244,232,205)",
            fontSize: "0.8125rem",
            lineHeight: "1.5",
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </>
  );
}
