'use client';

import { ConfigCategory, ConfigStore } from '@/lib/civ/ConfigStore';
import { Terrain, Feature, Resource, DistrictType, WonderType, TERRAIN_LABEL, TERRAIN_COLORS, FEATURE_LABEL, FEATURE_COLOR, RESOURCE_LABEL, RESOURCE_COLOR } from '@/lib/civ/types';
import { DISTRICT_META } from '@/lib/civ/District';
import { WONDER_DATA } from '@/lib/civ/Wonder';

interface ItemEntry { key: string; defaultLabel: string; defaultColor: string }

function getEntries(cat: ConfigCategory): ItemEntry[] {
  switch (cat) {
    case 'terrain':
      return (Object.values(Terrain) as Terrain[]).filter(t => t !== Terrain.Fog).map(t => ({
        key: t, defaultLabel: TERRAIN_LABEL[t], defaultColor: TERRAIN_COLORS[t],
      }));
    case 'feature':
      return (Object.values(Feature) as Feature[]).filter(f => f !== Feature.None).map(f => ({
        key: f, defaultLabel: FEATURE_LABEL[f], defaultColor: FEATURE_COLOR[f],
      }));
    case 'resource':
      return (Object.values(Resource) as Resource[]).filter(r => r !== Resource.None).map(r => ({
        key: r, defaultLabel: RESOURCE_LABEL[r], defaultColor: RESOURCE_COLOR[r],
      }));
    case 'district':
      return (Object.values(DistrictType) as DistrictType[]).map(d => ({
        key: d, defaultLabel: DISTRICT_META[d].name, defaultColor: DISTRICT_META[d].color,
      }));
    case 'wonder':
      return (Object.values(WonderType) as WonderType[]).map(w => ({
        key: w, defaultLabel: WONDER_DATA[w].name, defaultColor: WONDER_DATA[w].color,
      }));
  }
}

interface Props {
  category: ConfigCategory;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function ItemList({ category, selectedKey, onSelect }: Props) {
  const entries = getEntries(category);

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {entries.map(entry => {
        const cfg = ConfigStore.getItem(category, entry.key);
        const label = cfg.label ?? entry.defaultLabel;
        const color = cfg.color ?? entry.defaultColor;
        const hasOverride = Object.keys(cfg).length > 0;

        return (
          <button
            key={entry.key}
            onClick={() => onSelect(entry.key)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors
              ${selectedKey === entry.key
                ? 'bg-[var(--civ-gold-500)]/30 text-[var(--civ-gold-100)]'
                : 'text-[var(--civ-gold-200)] hover:bg-[var(--civ-gold-500)]/10'}`}
          >
            {cfg.icon ? (
              cfg.icon.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.icon} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
              ) : (
                <span className="w-5 text-center text-base shrink-0">{cfg.icon}</span>
              )
            ) : (
              <span className="w-5 h-5 rounded shrink-0 border border-white/10" style={{ backgroundColor: color }} />
            )}
            <span className="truncate flex-1">{label}</span>
            {hasOverride && <span className="text-[10px] text-[var(--civ-gold-500)] shrink-0">●</span>}
          </button>
        );
      })}
    </div>
  );
}
