import { Terrain, Feature, Resource, DistrictType, WonderType, TERRAIN_LABEL, TERRAIN_COLORS, FEATURE_LABEL, FEATURE_COLOR, RESOURCE_LABEL, RESOURCE_COLOR } from './types';
import { TERRAIN_BASE, FEATURE_BASE, RESOURCE_BASE } from './HexTile';
import { DISTRICT_META } from './District';
import { WONDER_DATA } from './Wonder';
import { ConfigCategory, ConfigItem, ConfigStore } from './ConfigStore';
import { Stats } from './Stats';

function statsToYields(s: Stats): ConfigItem['yields'] {
  const y: ConfigItem['yields'] = {};
  if (s.food)       y.food       = s.food;
  if (s.production) y.production = s.production;
  if (s.science)    y.science    = s.science;
  if (s.gold)       y.gold       = s.gold;
  if (s.culture)    y.culture    = s.culture;
  if (s.faith)      y.faith      = s.faith;
  if (s.housing)    y.housing    = s.housing;
  if (s.amenities)  y.amenities  = s.amenities;
  if (s.appeal)     y.appeal     = s.appeal;
  return y;
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

export function getDefaultItems(cat: ConfigCategory): ConfigItem[] {
  switch (cat) {
    case 'terrain':
      return TERRAIN_KEYS.map(t => ({
        key: t, label: TERRAIN_LABEL[t], color: TERRAIN_COLORS[t],
        yields: statsToYields(TERRAIN_BASE[t]),
        enabled: true, isCustom: false,
      }));
    case 'feature':
      return FEATURE_KEYS.map(f => ({
        key: f, label: FEATURE_LABEL[f], color: FEATURE_COLOR[f],
        yields: statsToYields(FEATURE_BASE[f]),
        enabled: true, isCustom: false,
      }));
    case 'resource':
      return RESOURCE_KEYS.map(r => ({
        key: r, label: RESOURCE_LABEL[r], color: RESOURCE_COLOR[r],
        yields: statsToYields(RESOURCE_BASE[r]),
        enabled: true, isCustom: false,
      }));
    case 'district':
      return (Object.values(DistrictType) as DistrictType[]).map(d => ({
        key: d, label: DISTRICT_META[d].name, color: DISTRICT_META[d].color,
        yields: {}, enabled: true, isCustom: false,
      }));
    case 'wonder':
      return (Object.values(WonderType) as WonderType[]).map(w => ({
        key: w, label: WONDER_DATA[w].name, color: WONDER_DATA[w].color,
        yields: statsToYields(WONDER_DATA[w].effect),
        enabled: true, isCustom: false,
      }));
  }
}

export function ensureSeeded(cat: ConfigCategory): ConfigItem[] {
  let list = ConfigStore.getList(cat);
  if (list.length === 0) {
    list = getDefaultItems(cat);
    ConfigStore.setList(cat, list);
  }
  return list;
}
