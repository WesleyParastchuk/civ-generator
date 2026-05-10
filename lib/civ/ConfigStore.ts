export interface ConfigItem {
  key: string;
  label: string;
  color: string;
  icon?: string;
  yields: {
    food?: number; production?: number; science?: number; gold?: number;
    culture?: number; faith?: number; housing?: number; amenities?: number; appeal?: number;
  };
  enabled: boolean;
  isCustom: boolean;
}

export interface AppConfig {
  terrain:  ConfigItem[];
  feature:  ConfigItem[];
  resource: ConfigItem[];
  district: ConfigItem[];
  wonder:   ConfigItem[];
}

export type ConfigCategory = keyof AppConfig;

const STORAGE_KEY = 'civ-config';
const EMPTY: AppConfig = { terrain: [], feature: [], resource: [], district: [], wonder: [] };

const listeners = new Set<() => void>();

function load(): AppConfig {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      terrain:  Array.isArray(parsed.terrain)  ? parsed.terrain  : [],
      feature:  Array.isArray(parsed.feature)  ? parsed.feature  : [],
      resource: Array.isArray(parsed.resource) ? parsed.resource : [],
      district: Array.isArray(parsed.district) ? parsed.district : [],
      wonder:   Array.isArray(parsed.wonder)   ? parsed.wonder   : [],
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
  static getList(cat: ConfigCategory): ConfigItem[] {
    return load()[cat];
  }

  static setList(cat: ConfigCategory, items: ConfigItem[]): void {
    const config = load();
    config[cat] = items;
    persist(config);
  }

  static updateItem(cat: ConfigCategory, key: string, patch: Partial<ConfigItem>): void {
    const config = load();
    const idx = config[cat].findIndex(i => i.key === key);
    if (idx === -1) return;
    config[cat][idx] = { ...config[cat][idx], ...patch };
    persist(config);
  }

  static addCustomItem(cat: ConfigCategory, item: Omit<ConfigItem, 'isCustom'>): void {
    const config = load();
    config[cat].push({ ...item, isCustom: true });
    persist(config);
  }

  static removeCustomItem(cat: ConfigCategory, key: string): void {
    const config = load();
    const item = config[cat].find(i => i.key === key);
    if (!item?.isCustom) return;
    config[cat] = config[cat].filter(i => i.key !== key);
    persist(config);
  }

  static subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
}
