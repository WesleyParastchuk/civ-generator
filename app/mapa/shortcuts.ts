import { Hand, MousePointer2, Cloud, Mountain, Trees, Gem, Building2, Star, Waves, Eraser } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ToolId } from '@/lib/civ/types';

export interface ToolDef {
  id: ToolId;
  label: string;
  hint: string;
  icon: LucideIcon;
  keyDigit: string;
}

export const TOOLS: ToolDef[] = [
  { id: ToolId.Select,   label: 'Selecionar',     hint: '1', icon: MousePointer2, keyDigit: '1' },
  { id: ToolId.Pan,      label: 'Mover',          hint: '2', icon: Hand,          keyDigit: '2' },
  { id: ToolId.Fog,      label: 'Névoa',          hint: '3', icon: Cloud,         keyDigit: '3' },
  { id: ToolId.Terrain,  label: 'Terreno',        hint: '4', icon: Mountain,      keyDigit: '4' },
  { id: ToolId.Feature,  label: 'Característica', hint: '5', icon: Trees,         keyDigit: '5' },
  { id: ToolId.Resource, label: 'Recurso',        hint: '6', icon: Gem,           keyDigit: '6' },
  { id: ToolId.District, label: 'Distrito',       hint: '7', icon: Building2,     keyDigit: '7' },
  { id: ToolId.Wonder,   label: 'Maravilha',      hint: '8', icon: Star,          keyDigit: '8' },
  { id: ToolId.River,    label: 'Rio',            hint: '9', icon: Waves,         keyDigit: '9' },
  { id: ToolId.Erase,    label: 'Apagar',         hint: '0', icon: Eraser,        keyDigit: '0' },
];

export function findToolByDigit(digit: string): ToolDef | undefined {
  return TOOLS.find(t => t.keyDigit === digit);
}
