import { Terrain, Feature, Resource, TERRAIN_COLORS, TERRAIN_LABEL, FEATURE_COLOR, FEATURE_LABEL, RESOURCE_COLOR, RESOURCE_LABEL } from './types';
import { ConfigStore } from './ConfigStore';

export function getTerrainColor(t: string): string {
  const item = ConfigStore.getList('terrain').find(i => i.key === t);
  return item?.color ?? (TERRAIN_COLORS as Record<string, string>)[t] ?? '#2a2f38';
}

export function getTerrainLabel(t: string): string {
  const item = ConfigStore.getList('terrain').find(i => i.key === t);
  return item?.label ?? (TERRAIN_LABEL as Record<string, string>)[t] ?? t;
}

export function getFeatureColor(f: string): string {
  const item = ConfigStore.getList('feature').find(i => i.key === f);
  return item?.color ?? (FEATURE_COLOR as Record<string, string>)[f] ?? '#555555';
}

export function getFeatureLabel(f: string): string {
  const item = ConfigStore.getList('feature').find(i => i.key === f);
  return item?.label ?? (FEATURE_LABEL as Record<string, string>)[f] ?? f;
}

export function getResourceLabel(r: string): string {
  const item = ConfigStore.getList('resource').find(i => i.key === r);
  return item?.label ?? (RESOURCE_LABEL as Record<string, string>)[r] ?? r;
}

export function getResourceColor(r: string): string {
  const item = ConfigStore.getList('resource').find(i => i.key === r);
  return item?.color ?? (RESOURCE_COLOR as Record<string, string>)[r] ?? '#555555';
}

// Re-export for use in admin default lookups
export { TERRAIN_COLORS, TERRAIN_LABEL, FEATURE_COLOR, FEATURE_LABEL, RESOURCE_COLOR, RESOURCE_LABEL };
export type { Terrain, Feature, Resource };
