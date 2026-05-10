import { Terrain, Feature, Resource, DistrictType, WonderType, ToolId, TERRAIN_COLORS, TERRAIN_LABEL, FEATURE_COLOR, FEATURE_LABEL, RESOURCE_COLOR, RESOURCE_LABEL } from '@/lib/civ/types';
import { DISTRICT_META } from '@/lib/civ/District';
import { WONDER_DATA } from '@/lib/civ/Wonder';
import { ConfigStore } from '@/lib/civ/ConfigStore';

export interface SubMenuItem {
  key: string;
  label: string;
  color: string;
  icon?: string;
  payload: Terrain | Feature | Resource | DistrictType | WonderType;
}

const TERRAIN_KEYS: Terrain[] = [
  Terrain.Grassland, Terrain.GrasslandHills, Terrain.Plains, Terrain.PlainsHills,
  Terrain.Desert, Terrain.DesertHills, Terrain.Tundra, Terrain.TundraHills,
  Terrain.Snow, Terrain.SnowHills, Terrain.Mountain, Terrain.Ocean, Terrain.Coast,
];

const FEATURE_KEYS: Feature[] = [
  Feature.Forest, Feature.Rainforest, Feature.Marsh, Feature.Floodplains,
  Feature.Oasis, Feature.Reef, Feature.Ice,
];

const RESOURCE_KEYS: Resource[] = [
  Resource.Wheat, Resource.Rice, Resource.Cattle, Resource.Sheep,
  Resource.Deer, Resource.Bananas, Resource.Fish, Resource.Crabs,
  Resource.Stone, Resource.Copper,
  Resource.Wine, Resource.Silk, Resource.Citrus, Resource.Cotton,
  Resource.Diamonds, Resource.Furs, Resource.Ivory, Resource.Jade,
  Resource.Pearls, Resource.Salt, Resource.Silver, Resource.Spices,
  Resource.Sugar, Resource.Tea, Resource.Tobacco, Resource.Truffles,
  Resource.Horses, Resource.Iron, Resource.Niter, Resource.Coal,
  Resource.Oil, Resource.Aluminum, Resource.Uranium,
];

const DISTRICT_KEYS: DistrictType[] = Object.values(DistrictType);
const WONDER_KEYS: WonderType[] = Object.values(WonderType);

export function getSubMenuItems(toolId: ToolId): SubMenuItem[] {
  switch (toolId) {
    case ToolId.Terrain:
      return TERRAIN_KEYS.map(t => {
        const cfg = ConfigStore.getItem('terrain', t);
        return { key: t, label: cfg.label ?? TERRAIN_LABEL[t], color: cfg.color ?? TERRAIN_COLORS[t], icon: cfg.icon, payload: t };
      });

    case ToolId.Feature:
      return FEATURE_KEYS.map(f => {
        const cfg = ConfigStore.getItem('feature', f);
        return { key: f, label: cfg.label ?? FEATURE_LABEL[f], color: cfg.color ?? FEATURE_COLOR[f], icon: cfg.icon, payload: f };
      });

    case ToolId.Resource:
      return RESOURCE_KEYS.map(r => {
        const cfg = ConfigStore.getItem('resource', r);
        return { key: r, label: cfg.label ?? RESOURCE_LABEL[r], color: cfg.color ?? RESOURCE_COLOR[r], icon: cfg.icon, payload: r };
      });

    case ToolId.District:
      return DISTRICT_KEYS.map(d => {
        const cfg = ConfigStore.getItem('district', d);
        const meta = DISTRICT_META[d];
        return { key: d, label: cfg.label ?? meta.name, color: cfg.color ?? meta.color, icon: cfg.icon, payload: d };
      });

    case ToolId.Wonder:
      return WONDER_KEYS.map(w => {
        const cfg = ConfigStore.getItem('wonder', w);
        const data = WONDER_DATA[w];
        return { key: w, label: cfg.label ?? data.name, color: cfg.color ?? data.color, icon: cfg.icon, payload: w };
      });

    default:
      return [];
  }
}

export const TOOLS_WITH_SUBMENU: ToolId[] = [
  ToolId.Terrain, ToolId.Feature, ToolId.Resource, ToolId.District, ToolId.Wonder,
];
