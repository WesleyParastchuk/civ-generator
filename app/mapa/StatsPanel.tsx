'use client';

import { GameMap } from '@/lib/civ/GameMap';
import { TERRAIN_LABEL } from '@/lib/civ/types';
import { District } from '@/lib/civ/District';
import { Wonder } from '@/lib/civ/Wonder';

interface Props {
  map: GameMap;
  selectedKey: string | null;
}

export function StatsPanel({ map, selectedKey }: Props) {
  if (!selectedKey) return null;
  const tile = map.getOrUndefined(selectedKey);
  if (!tile) return null;

  const stats = tile.getFinalStats(map);

  return (
    <div className="absolute bottom-4 left-4 bg-[var(--civ-panel)] border border-[var(--civ-gold-500)]/30 rounded-md p-3 text-xs text-[var(--civ-gold-100)] w-56 shadow-lg pointer-events-auto">
      <div className="font-mono text-[10px] text-[var(--civ-gold-300)]/60 mb-2">
        ({tile.q}, {tile.r}) — {TERRAIN_LABEL[tile.terrain]}
      </div>

      {tile.placement instanceof District && (
        <div className="mb-2 text-[var(--civ-gold-200)]" style={{ color: tile.placement.color }}>
          {tile.placement.abbr} · {tile.placement.name}
        </div>
      )}
      {tile.placement instanceof Wonder && (
        <div className="mb-2" style={{ color: tile.placement.color }}>
          ★ {tile.placement.name}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <Yield label="Comida"       value={stats.food} />
        <Yield label="Produção"     value={stats.production} />
        <Yield label="Ciência"      value={stats.science} />
        <Yield label="Ouro"         value={stats.gold} />
        <Yield label="Cultura"      value={stats.culture} />
        <Yield label="Fé"           value={stats.faith} />
        <Yield label="Moradia"      value={stats.housing}   isInt />
        <Yield label="Comodidade"   value={stats.amenities} isInt />
        <Yield label="Atratividade" value={stats.appeal}    isInt />
      </div>
    </div>
  );
}

function Yield({ label, value, isInt }: { label: string; value: number; isInt?: boolean }) {
  if (value === 0) return null;
  const display = isInt ? String(Math.round(value)) : value.toFixed(1);
  return (
    <div className="flex justify-between font-mono">
      <span className="text-[var(--civ-gold-300)]/70">{label}</span>
      <span className={value > 0 ? 'text-emerald-300' : 'text-red-300'}>
        {value > 0 ? '+' : ''}{display}
      </span>
    </div>
  );
}
