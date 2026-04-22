"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Minus, Plus, ThumbsUp } from "lucide-react";
import type { ConfigFieldSchema, SelectFieldSchema, ToggleFieldSchema, RangeFieldSchema } from "@/lib/lobbyTypes";

export type LeaderEntry = {
  id: number;
  civilization: string;
  leader: string;
  civIcon?: string;
  leaderPortrait?: string;
};

type BaseProps = {
  fieldKey: string;
  schema: ConfigFieldSchema;
  leaders: LeaderEntry[];
  pointsRemaining: number;
  turnVoteTally: Record<string, number>;   // all voters: value → total weight this turn
  myTurnVoteTally: Record<string, number>; // this player only: value → weight this turn
  onVote: (value: string | number | boolean, weight: number) => void;
  onRemoveVote: (value: string | number | boolean) => void;
};

export function VotingField(props: BaseProps) {
  if (props.schema.type === "select") {
    return <SelectVoteField {...props} schema={props.schema} />;
  }
  if (props.schema.type === "toggle") {
    return <ToggleVoteField {...props} schema={props.schema} />;
  }
  return <RangeVoteField {...props} schema={props.schema} />;
}

// ---------------------------------------------------------------------------
// Select — custom dropdown with images, multiple votes allowed
// ---------------------------------------------------------------------------

type SelectProps = Omit<BaseProps, "schema"> & { schema: SelectFieldSchema };
type ToggleProps = Omit<BaseProps, "schema"> & { schema: ToggleFieldSchema };
type RangeProps = Omit<BaseProps, "schema"> & { schema: RangeFieldSchema };

type NormalizedOption = {
  value: string | number;
  label: string;
  weight: number;
  civIcon?: string;
  leaderPortrait?: string;
};

function SelectVoteField({ schema, leaders, pointsRemaining, myTurnVoteTally, onVote, onRemoveVote }: SelectProps) {
  const options = buildSelectOptions(schema, leaders);
  const [selectedValue, setSelectedValue] = useState<string>(String(options[0]?.value ?? ""));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOpt = options.find((o) => String(o.value) === selectedValue);
  const weight = selectedOpt?.weight ?? 1;
  const canVote = pointsRemaining >= weight;
  const mySpentOnSelected = myTurnVoteTally[selectedValue] ?? 0;

  const hasImages = schema.leadersSource;

  return (
    <div className="rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-3 space-y-2">
      {/* Custom dropdown trigger */}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border border-[rgb(190_153_81_/_0.35)] bg-[rgb(11_25_44_/_0.9)] px-3 py-2 text-left text-sm text-[rgb(232_209_158_/_0.9)] outline-none focus:border-[rgb(214_178_97_/_0.6)]"
        >
          {hasImages && selectedOpt?.civIcon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOpt.civIcon} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
          )}
          {hasImages && selectedOpt?.leaderPortrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOpt.leaderPortrait} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
          )}
          <span className="flex-1 truncate">{selectedOpt?.label ?? "—"}</span>
          <span className="shrink-0 text-xs text-[rgb(214_178_97_/_0.7)]">{weight} pt{weight !== 1 ? "s" : ""}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[rgb(214_178_97_/_0.6)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[rgb(190_153_81_/_0.4)] bg-[rgb(8_18_32_/_0.98)] shadow-[0_8px_32px_rgb(2_7_15_/_0.7)]">
            {options.map((opt) => {
              const isSelected = String(opt.value) === selectedValue;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { setSelectedValue(String(opt.value)); setOpen(false); }}
                  className={[
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-[rgb(23_47_76_/_0.8)] text-[rgb(239_223_187_/_0.95)]"
                      : "text-[rgb(232_209_158_/_0.85)] hover:bg-[rgb(23_47_76_/_0.5)]",
                  ].join(" ")}
                >
                  {hasImages && (
                    <div className="flex shrink-0 gap-1.5">
                      {opt.civIcon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opt.civIcon} alt="" className="h-8 w-8 rounded object-contain bg-[rgb(11_25_44_/_0.6)] p-0.5" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-[rgb(11_25_44_/_0.4)]" />
                      )}
                      {opt.leaderPortrait ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opt.leaderPortrait} alt="" className="h-8 w-8 rounded object-contain bg-[rgb(11_25_44_/_0.6)] p-0.5" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-[rgb(11_25_44_/_0.4)]" />
                      )}
                    </div>
                  )}
                  <span className="flex-1 truncate">{opt.label}</span>
                  <span className="shrink-0 text-xs text-[rgb(214_178_97_/_0.6)]">{opt.weight} pt{opt.weight !== 1 ? "s" : ""}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Vote button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canVote && mySpentOnSelected === 0}
          onClick={() => { if (selectedOpt && canVote) onVote(selectedOpt.value, weight); }}
          onContextMenu={(e) => { e.preventDefault(); if (selectedOpt && mySpentOnSelected > 0) onRemoveVote(selectedOpt.value); }}
          aria-label={`Votar em ${selectedOpt?.label ?? ""} (clique direito para remover)`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgb(214_178_97_/_0.54)] bg-gradient-to-b from-[rgb(24_53_84_/_0.94)] to-[rgb(13_28_48_/_0.96)] py-2.5 text-sm font-semibold text-[rgb(237_210_148_/_0.96)] shadow-[inset_0_0_0_1px_rgb(255_220_150_/_0.07)] transition-all duration-150 hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ThumbsUp className="h-4 w-4 shrink-0" />
          Votar · {weight} pt{weight !== 1 ? "s" : ""}
        </button>

        {mySpentOnSelected > 0 && (
          <span className="shrink-0 text-xs text-[rgb(214_178_97_/_0.8)]">
            Seus: <span className="font-bold">{mySpentOnSelected} pts</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

function ToggleVoteField({ schema, pointsRemaining, turnVoteTally, onVote }: ToggleProps) {
  const { weight } = schema;
  const canVote = pointsRemaining >= weight;

  const options = [
    { value: true, label: "Ativar" },
    { value: false, label: "Desativar" },
  ];

  return (
    <div className="space-y-1.5">
      {options.map(({ value, label }) => {
        const tally = turnVoteTally[String(value)] ?? 0;
        return (
          <div
            key={String(value)}
            className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm text-[rgb(232_209_158_/_0.9)]">{label}</span>
              {tally > 0 && (
                <span className="ml-2 text-xs text-[rgb(206_189_156_/_0.55)]">+{tally} pts</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded border border-[rgb(190_153_81_/_0.35)] bg-[rgb(23_47_76_/_0.7)] px-2 py-0.5 text-xs font-semibold text-[rgb(214_178_97_/_0.85)]">
                {weight} pt{weight !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                disabled={!canVote}
                onClick={() => onVote(value, weight)}
                className="game-control-button h-7 w-7 text-xs"
                aria-label={`Votar: ${label}`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Range
// ---------------------------------------------------------------------------

const RANGE_WEIGHT = 1;

function RangeVoteField({ schema, pointsRemaining, turnVoteTally, onVote }: RangeProps) {
  const { min, max, unit } = schema;
  const [selected, setSelected] = useState<number>(schema.default);
  const canVote = pointsRemaining >= RANGE_WEIGHT;
  const tally = turnVoteTally[String(selected)] ?? 0;

  return (
    <div className="rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="game-control-button"
          disabled={selected <= min}
          onClick={() => setSelected((v) => Math.max(min, v - 1))}
          aria-label="Diminuir"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-lg font-bold text-[rgb(239_223_187_/_0.95)]">{selected}</span>
          {unit && <span className="text-xs text-[rgb(206_189_156_/_0.6)]">{unit}</span>}
          {tally > 0 && (
            <span className="text-xs text-[rgb(206_189_156_/_0.55)]">+{tally} pts votados</span>
          )}
        </div>
        <button
          type="button"
          className="game-control-button"
          disabled={selected >= max}
          onClick={() => setSelected((v) => Math.min(max, v + 1))}
          aria-label="Aumentar"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-[rgb(206_189_156_/_0.5)]">min {min} — max {max}</span>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[rgb(190_153_81_/_0.35)] bg-[rgb(23_47_76_/_0.7)] px-2 py-0.5 text-xs font-semibold text-[rgb(214_178_97_/_0.85)]">
            {RANGE_WEIGHT} pt
          </span>
          <button
            type="button"
            disabled={!canVote}
            onClick={() => onVote(selected, RANGE_WEIGHT)}
            className="game-control-button h-7 w-7 text-xs"
            aria-label="Votar neste valor"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSelectOptions(schema: SelectFieldSchema, leaders: LeaderEntry[]): NormalizedOption[] {
  if (schema.options) {
    return schema.options.map((o) => ({ value: o.value, label: o.label, weight: o.weight }));
  }
  if (schema.leadersSource) {
    return leaders
      .filter((l) => l.id >= 1)
      .map((l) => ({
        value: l.id,
        label: `${l.leader} (${l.civilization})`,
        weight: 1,
        civIcon: l.civIcon,
        leaderPortrait: l.leaderPortrait,
      }));
  }
  return [];
}
