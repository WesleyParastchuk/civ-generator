"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { playTick, playDramaticTick } from "@/lib/sounds";

type ShellProps = {
  children: ReactNode;
  subtitle: string;
};

export function CountdownShell({ children, subtitle }: ShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgb(2_7_15_/_0.92)] backdrop-blur-sm">
      {children}
      <p className="mt-6 font-[var(--font-cinzel)] text-lg uppercase tracking-widest text-[rgb(206_189_156_/_0.65)]">
        {subtitle}
      </p>
    </div>
  );
}

// Renders one number. Mount with key={value} from parent to retrigger animation.
// animated=true → countdown-pop with glow (use when value ≤ 3)
// animated=false → static display, no pulse
export function CountdownNumber({ value, animated }: { value: number | string; animated: boolean }) {
  useEffect(() => {
    if (value === "" || value === 0) return;
    if (animated) playDramaticTick();
    else playTick();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (animated) {
    return (
      <span
        className="font-[var(--font-cinzel)] text-[10rem] font-bold leading-none text-[rgb(214_178_97_/_0.95)]"
        style={{
          display: "block",
          animation: "countdown-pop 1000ms ease-out both",
          textShadow: "0 0 60px rgb(214 178 97 / 0.6), 0 0 120px rgb(214 178 97 / 0.25)",
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <span
      className="font-[var(--font-cinzel)] text-[10rem] font-bold leading-none text-[rgb(214_178_97_/_0.6)]"
      style={{ display: "block", textShadow: "0 0 20px rgb(214 178 97 / 0.2)" }}
    >
      {value}
    </span>
  );
}
