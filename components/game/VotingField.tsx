"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { ConfigFieldSchema, SelectFieldSchema, ToggleFieldSchema, RangeFieldSchema } from "@/lib/lobbyTypes";

export type LeaderEntry = {
  id: number;
  civilization: string;
  leader: string;
};

type BaseProps = {
  fieldKey: string;
  schema: ConfigFieldSchema;
  leaders: LeaderEntry[];
  pointsRemaining: number;
  turnVoteTally: Record<string, number>; // value string → total weight all voters this turn
  myVotedThisField: boolean;            // current player already voted this (scope, field) this turn
  onVote: (value: string | number | boolean, weight: number) => void;
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
// Select — dropdown with single vote per turn
// ---------------------------------------------------------------------------

type SelectProps = Omit<BaseProps, "schema"> & { schema: SelectFieldSchema };

function SelectVoteField({ schema, leaders, pointsRemaining, turnVoteTally, myVotedThisField, onVote }: SelectProps) {
  const options = buildSelectOptions(schema, leaders);
  const [selectedValue, setSelectedValue] = useState<string>(
    String(options[0]?.value ?? ""),
  );

  const selectedOpt = options.find((o) => String(o.value) === selectedValue);
  const weight = selectedOpt?.weight ?? 1;
  const canVote = !myVotedThisField && pointsRemaining >= weight;

  const tallyEntries = Object.entries(turnVoteTally)
    .filter(([, pts]) => pts > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-lg border border-[rgb(190_153_81_/_0.2)] bg-[rgb(10_20_34_/_0.6)] px-3 py-3">
      <div className="flex items-center gap-2">
        <select
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          disabled={myVotedThisField}
          className="h-9 flex-1 rounded-lg border border-[rgb(190_153_81_/_0.35)] bg-[rgb(11_25_44_/_0.9)] px-2 text-sm text-[rgb(232_209_158_/_0.9)] outline-none focus:border-[rgb(214_178_97_/_0.6)] disabled:opacity-50"
        >
          {options.map((opt) => (
            <option
              key={String(opt.value)}
              value={String(opt.value)}
              className="bg-[rgb(11_25_44)] text-[rgb(232_209_158)]"
            >
              {opt.label} — {opt.weight} pt{opt.weight !== 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!canVote}
          onClick={() => { if (selectedOpt) onVote(selectedOpt.value, weight); }}
          className="game-control-button h-9 shrink-0 rounded-lg px-3 text-xs font-semibold"
          aria-label={`Votar em ${selectedOpt?.label ?? ""}`}
        >
          Votar
        </button>
      </div>
      {myVotedThisField && (
        <p className="mt-1.5 text-xs text-[rgb(206_189_156_/_0.5)]">
          Voto registrado neste turno.
        </p>
      )}
      {tallyEntries.length > 0 && (
        <p className="mt-1.5 text-xs text-[rgb(206_189_156_/_0.45)] leading-relaxed">
          {tallyEntries.map(([val, pts]) => {
            const lbl = options.find((o) => String(o.value) === val)?.label ?? val;
            return `${lbl}: ${pts}pts`;
          }).join(" · ")}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

type ToggleProps = Omit<BaseProps, "schema"> & { schema: ToggleFieldSchema };

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

type RangeProps = Omit<BaseProps, "schema"> & { schema: RangeFieldSchema };

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

type NormalizedOption = { value: string | number; label: string; weight: number };

function buildSelectOptions(schema: SelectFieldSchema, leaders: LeaderEntry[]): NormalizedOption[] {
  if (schema.options) {
    return schema.options.map((o) => ({ value: o.value, label: o.label, weight: o.weight }));
  }
  if (schema.leadersSource) {
    return leaders
      .filter((l) => l.id >= 1)
      .map((l) => ({ value: l.id, label: `${l.leader} (${l.civilization})`, weight: 1 }));
  }
  return [];
}
