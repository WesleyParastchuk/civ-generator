import { Terrain, Feature, Resource, TERRAIN_COLORS, TERRAIN_LABEL, FEATURE_COLOR, FEATURE_LABEL, RESOURCE_COLOR, RESOURCE_LABEL } from './types';
import { ConfigStore } from './ConfigStore';

export function getTerrainColor(t: Terrain): string {
  return ConfigStore.getItem('terrain', t).color ?? TERRAIN_COLORS[t];
}

export function getTerrainLabel(t: Terrain): string {
  return ConfigStore.getItem('terrain', t).label ?? TERRAIN_LABEL[t];
}

export function getFeatureColor(f: Feature): string {
  return ConfigStore.getItem('feature', f).color ?? FEATURE_COLOR[f];
}

export function getFeatureLabel(f: Feature): string {
  return ConfigStore.getItem('feature', f).label ?? FEATURE_LABEL[f];
}

export function getResourceLabel(r: Resource): string {
  return ConfigStore.getItem('resource', r).label ?? RESOURCE_LABEL[r];
}

export function getResourceColor(r: Resource): string {
  return ConfigStore.getItem('resource', r).color ?? RESOURCE_COLOR[r];
}
