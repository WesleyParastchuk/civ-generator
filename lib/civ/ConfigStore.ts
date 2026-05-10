import { Terrain, Feature, Resource, DistrictType, WonderType } from './types';

export interface ItemConfig {
  label?: string;
  color?: string;
  icon?: string; // base64 data URL (starts with "data:") or single emoji char
  yields?: {
    food?: number;
    production?: number;
    science?: number;
    gold?: number;
    culture?: number;
    faith?: number;
    housing?: number;
    amenities?: number;
    appeal?: number;
  };
}

export interface AppConfig {
  terrain:  Partial<Record<Terrain,      ItemConfig>>;
  feature:  Partial<Record<Feature,      ItemConfig>>;
  resource: Partial<Record<Resource,     ItemConfig>>;
  district: Partial<Record<DistrictType, ItemConfig>>;
  wonder:   Partial<Record<WonderType,   ItemConfig>>;
}

export type ConfigCategory = keyof AppConfig;

const STORAGE_KEY = 'civ-config';
const EMPTY: AppConfig = { terrain: {}, feature: {}, resource: {}, district: {}, wonder: {} };

const listeners = new Set<() => void>();

function load(): AppConfig {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      terrain:  parsed.terrain  ?? {},
      feature:  parsed.feature  ?? {},
      resource: parsed.resource ?? {},
      district: parsed.district ?? {},
      wonder:   parsed.wonder   ?? {},
    };
  } catch {
    return { ...EMPTY };
  }
}

function persist(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  listeners.forEach(l => l());
}

export class ConfigStore {
  static get(): AppConfig {
    return load();
  }

  static getItem(cat: ConfigCategory, key: string): ItemConfig {
    const config = load();
    return (config[cat] as Record<string, ItemConfig>)[key] ?? {};
  }

  static setItem(cat: ConfigCategory, key: string, patch: Partial<ItemConfig>): void {
    const config = load();
    const existing = (config[cat] as Record<string, ItemConfig>)[key] ?? {};
    const mergedYields = patch.yields !== undefined
      ? { ...existing.yields, ...patch.yields }
      : existing.yields;
    (config[cat] as Record<string, ItemConfig>)[key] = {
      ...existing,
      ...patch,
      ...(mergedYields !== undefined ? { yields: mergedYields } : {}),
    };
    persist(config);
  }

  static resetItem(cat: ConfigCategory, key: string): void {
    const config = load();
    delete (config[cat] as Record<string, ItemConfig>)[key];
    persist(config);
  }

  static subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
}
