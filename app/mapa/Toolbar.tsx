'use client';

import { TOOLS, ToolDef } from './shortcuts';
import { ToolId, Terrain, Feature, Resource, DistrictType, WonderType } from '@/lib/civ/types';
import type { ToolState } from './MapEditor';

interface Props {
  tool: ToolState;
  onSelectTool: (def: ToolDef) => void;
}

export function Toolbar({ tool, onSelectTool }: Props) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--civ-panel)] border border-[var(--civ-gold-500)]/30 rounded-md flex items-center gap-1 p-1 shadow-lg pointer-events-auto">
      {TOOLS.map(def => {
        const active = tool.id === def.id;
        const Icon = def.icon;
        return (
          <button
            key={def.id}
            title={`${def.label} (${def.hint})`}
            onClick={() => onSelectTool(def)}
            className={`relative w-10 h-10 rounded flex items-center justify-center transition-colors
              ${active
                ? 'bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)]'
                : 'text-[var(--civ-gold-300)] hover:bg-[var(--civ-gold-500)]/20'}`}
          >
            <Icon size={18} />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono opacity-60">
              {def.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function defaultToolState(def: ToolDef): ToolState {
  switch (def.id) {
    case ToolId.Terrain:  return { id: ToolId.Terrain,  payload: Terrain.Grassland };
    case ToolId.Feature:  return { id: ToolId.Feature,  payload: Feature.Forest };
    case ToolId.Resource: return { id: ToolId.Resource, payload: Resource.Wheat };
    case ToolId.District: return { id: ToolId.District, payload: DistrictType.CityCenter };
    case ToolId.Wonder:   return { id: ToolId.Wonder,   payload: WonderType.Pyramids };
    case ToolId.Select:   return { id: ToolId.Select };
    case ToolId.Pan:      return { id: ToolId.Pan };
    case ToolId.Fog:      return { id: ToolId.Fog };
    case ToolId.River:    return { id: ToolId.River };
    case ToolId.Erase:    return { id: ToolId.Erase };
  }
}
