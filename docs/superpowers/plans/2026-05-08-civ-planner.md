# Civ VI City Planner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Civilization VI city planner: infinite-canvas hex grid, OOP domain (Stats / Placement / District / Wonder / HexTile / GameMap), fog auto-expansion on click, Excalidraw-style toolbar with keyboard shortcuts 1–0, dynamic adjacency-bonus engine, and a 25-step undo system.

**Architecture:** Strict OOP per class diagram. Pure-domain layer (`lib/civ/`) is React-free. React owns tool state and invokes commands on a `GameMap` instance. Every mutation is wrapped in an `Action` and pushed to `HistoryManager` (max 25). Canvas renders the viewport from `GameMap.hexes`. Adjacency is computed dynamically by each `District` consulting its `HexTile` + `GameMap` neighbors.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, HTML5 Canvas, lucide-react. No new npm packages.

---

## File Structure

```
lib/civ/
  types.ts             — All enums: Terrain, Feature, Resource, DistrictType, WonderType,
                         BuildingType, ToolId. Yield bag and label maps.
  Stats.ts             — Stats class (food/prod/science/gold/culture/faith floats +
                         housing/amenities/appeal ints). add() / scale() / clone() / static
                         of(partial) / static zero().
  HexCoord.ts          — Axial coords (q, r). toPixel/fromPixel. neighbors. distance.
                         hexCorners helper for canvas.
  HexEdge.ts           — Edge data (hasRiver, hasCliff). 6 per HexTile.
  Requirement.ts       — Requirement interface + concrete:
                         RequireAdjacentMountain, RequireCoastal, RequireRiver,
                         RequireFlat, RequireFreshWater, RequireNoExistingPlacement.
  Building.ts          — BuildingType enum + Building class (id, label, stats).
  Placement.ts         — Placement abstract: name, requirements, getEffect(tile, map): Stats.
  District.ts          — District extends Placement: type + buildings + getAdjacencyBonus.
                         Concrete: CityCenter, Campus, CommercialHub, HolySite, IndustrialZone,
                         TheaterSquare, Harbor, Encampment, EntertainmentComplex, Aqueduct,
                         Dam, Neighborhood, Aerodrome, Spaceport, GovernmentPlaza.
                         DistrictFactory.create(type).
  Wonder.ts            — Wonder extends Placement: type + getEffect. WONDER_DATA.
                         WonderFactory.create(type).
  HexTile.ts           — HexTile: q, r, terrain, feature, resource, placement, edges[6],
                         hasFreshWater. getBaseStats() / getFinalStats(map).
  GameMap.ts           — GameMap: hexes Map<key, HexTile>, playerContext, history.
                         getTile / setTile / removeTile / neighbors / distance.
                         expandFogFrom(coord, radius=2). updateHex (deferred to Action).
  Action.ts            — Action interface + concrete: SetTerrainAction, SetFeatureAction,
                         SetResourceAction, SetPlacementAction, FogActivateAction
                         (composite: terrain change + auto-expansion),
                         CompositeAction (groups N actions).
  HistoryManager.ts    — push(action) / undo() / canUndo. maxSteps = 25.
  PlayerContext.ts     — Civilization, Policy, Tech enums + PlayerContext class.

app/mapa/
  page.tsx             — Existing route, imports MapEditor.
  MapEditor.tsx        — NEW: holds GameMap (useRef), tool state, selection, transform.
                         Owns keyboard listener. Coordinates HexCanvas + Toolbar + StatsPanel.
  HexCanvas.tsx        — RENAME of existing HexGrid.tsx. Accepts GameMap + transform +
                         selectedKey + tool. Renders + handles pan/zoom/click.
  Toolbar.tsx          — Top horizontal bar: tool buttons 1–0 with icons + keyboard hints.
  StatsPanel.tsx       — Bottom-left floating panel: shows getFinalStats() of selected tile.
  shortcuts.ts         — TOOLS array (id, label, keyHint, icon). Keyboard map.
```

---

### Task 1: Foundation — types, Stats, HexCoord, HexEdge

**Files:**
- Create: `lib/civ/types.ts`
- Create: `lib/civ/Stats.ts`
- Create: `lib/civ/HexCoord.ts`
- Create: `lib/civ/HexEdge.ts`

- [ ] **Step 1: Create `lib/civ/types.ts`**

```ts
export enum Terrain {
  Fog = 'fog',
  Ocean = 'ocean',
  Coast = 'coast',
  Grassland = 'grassland',
  GrasslandHills = 'grassland_hills',
  Plains = 'plains',
  PlainsHills = 'plains_hills',
  Desert = 'desert',
  DesertHills = 'desert_hills',
  Tundra = 'tundra',
  TundraHills = 'tundra_hills',
  Snow = 'snow',
  SnowHills = 'snow_hills',
  Mountain = 'mountain',
}

export enum Feature {
  None = 'none',
  Forest = 'forest',
  Rainforest = 'rainforest',
  Marsh = 'marsh',
  Floodplains = 'floodplains',
  Oasis = 'oasis',
  Reef = 'reef',
  Ice = 'ice',
}

export enum Resource {
  None = 'none',
  // bonus
  Wheat = 'wheat', Rice = 'rice', Cattle = 'cattle', Sheep = 'sheep',
  Deer = 'deer', Bananas = 'bananas', Fish = 'fish', Crabs = 'crabs',
  Stone = 'stone', Copper = 'copper',
  // luxury
  Wine = 'wine', Silk = 'silk', Citrus = 'citrus', Cotton = 'cotton',
  Diamonds = 'diamonds', Furs = 'furs', Ivory = 'ivory', Jade = 'jade',
  Pearls = 'pearls', Salt = 'salt', Silver = 'silver', Spices = 'spices',
  Sugar = 'sugar', Tea = 'tea', Tobacco = 'tobacco', Truffles = 'truffles',
  // strategic
  Horses = 'horses', Iron = 'iron', Niter = 'niter', Coal = 'coal',
  Oil = 'oil', Aluminum = 'aluminum', Uranium = 'uranium',
}

export enum DistrictType {
  CityCenter = 'city_center',
  Campus = 'campus',
  CommercialHub = 'commercial_hub',
  HolySite = 'holy_site',
  IndustrialZone = 'industrial_zone',
  TheaterSquare = 'theater_square',
  Harbor = 'harbor',
  Encampment = 'encampment',
  EntertainmentComplex = 'entertainment_complex',
  Aqueduct = 'aqueduct',
  Dam = 'dam',
  Neighborhood = 'neighborhood',
  Aerodrome = 'aerodrome',
  Spaceport = 'spaceport',
  GovernmentPlaza = 'government_plaza',
}

export enum WonderType {
  Pyramids = 'pyramids',
  Stonehenge = 'stonehenge',
  HangingGardens = 'hanging_gardens',
  GreatLibrary = 'great_library',
  Oracle = 'oracle',
  Colosseum = 'colosseum',
  Petra = 'petra',
  HagiaSophia = 'hagia_sophia',
  MachuPicchu = 'machu_picchu',
  ChichenItza = 'chichen_itza',
  ForbiddenCity = 'forbidden_city',
  TajMahal = 'taj_mahal',
  Versailles = 'palace_of_versailles',
  BigBen = 'big_ben',
  EiffelTower = 'eiffel_tower',
  StatueOfLiberty = 'statue_of_liberty',
  CristoRedentor = 'cristo_redentor',
}

export enum ToolId {
  Select = 'select',
  Fog = 'fog',
  Terrain = 'terrain',
  Feature = 'feature',
  Resource = 'resource',
  District = 'district',
  Wonder = 'wonder',
  River = 'river',
  Erase = 'erase',
  Pan = 'pan',
}

export const TERRAIN_COLORS: Record<Terrain, string> = {
  [Terrain.Fog]:            '#2a2f38',
  [Terrain.Ocean]:          '#1a3a5c',
  [Terrain.Coast]:          '#2d6a9f',
  [Terrain.Grassland]:      '#4a7c3f',
  [Terrain.GrasslandHills]: '#3d6834',
  [Terrain.Plains]:         '#c8a850',
  [Terrain.PlainsHills]:    '#b09040',
  [Terrain.Desert]:         '#d4b483',
  [Terrain.DesertHills]:    '#c0a070',
  [Terrain.Tundra]:         '#8fa8a0',
  [Terrain.TundraHills]:    '#7a9390',
  [Terrain.Snow]:           '#dde8ee',
  [Terrain.SnowHills]:      '#c8d8e0',
  [Terrain.Mountain]:       '#6b5a4e',
};

export const TERRAIN_LABEL: Record<Terrain, string> = {
  [Terrain.Fog]:            'Névoa',
  [Terrain.Ocean]:          'Oceano',
  [Terrain.Coast]:          'Costa',
  [Terrain.Grassland]:      'Planície Verde',
  [Terrain.GrasslandHills]: 'Colinas Verdes',
  [Terrain.Plains]:         'Planície',
  [Terrain.PlainsHills]:    'Colinas',
  [Terrain.Desert]:         'Deserto',
  [Terrain.DesertHills]:    'Colinas Desérticas',
  [Terrain.Tundra]:         'Tundra',
  [Terrain.TundraHills]:    'Colinas Tundra',
  [Terrain.Snow]:           'Neve',
  [Terrain.SnowHills]:      'Colinas Nevadas',
  [Terrain.Mountain]:       'Montanha',
};

export function isHills(t: Terrain): boolean {
  return t === Terrain.GrasslandHills || t === Terrain.PlainsHills ||
         t === Terrain.DesertHills || t === Terrain.TundraHills ||
         t === Terrain.SnowHills;
}

export function isWater(t: Terrain): boolean {
  return t === Terrain.Ocean || t === Terrain.Coast;
}

export function isImpassable(t: Terrain): boolean {
  return t === Terrain.Mountain;
}
```

- [ ] **Step 2: Create `lib/civ/Stats.ts`**

```ts
export class Stats {
  food = 0;
  production = 0;
  science = 0;
  gold = 0;
  culture = 0;
  faith = 0;
  housing = 0;
  amenities = 0;
  appeal = 0;

  add(other: Stats): this {
    this.food += other.food;
    this.production += other.production;
    this.science += other.science;
    this.gold += other.gold;
    this.culture += other.culture;
    this.faith += other.faith;
    this.housing += other.housing;
    this.amenities += other.amenities;
    this.appeal += other.appeal;
    return this;
  }

  scale(n: number): this {
    this.food *= n;
    this.production *= n;
    this.science *= n;
    this.gold *= n;
    this.culture *= n;
    this.faith *= n;
    this.housing *= n;
    this.amenities *= n;
    this.appeal *= n;
    return this;
  }

  clone(): Stats {
    const s = new Stats();
    Object.assign(s, this);
    return s;
  }

  isZero(): boolean {
    return this.food === 0 && this.production === 0 && this.science === 0 &&
           this.gold === 0 && this.culture === 0 && this.faith === 0 &&
           this.housing === 0 && this.amenities === 0 && this.appeal === 0;
  }

  static zero(): Stats {
    return new Stats();
  }

  static of(partial: Partial<Pick<Stats,
    'food' | 'production' | 'science' | 'gold' | 'culture' | 'faith' |
    'housing' | 'amenities' | 'appeal'
  >>): Stats {
    const s = new Stats();
    Object.assign(s, partial);
    return s;
  }
}
```

- [ ] **Step 3: Create `lib/civ/HexCoord.ts`**

```ts
const SQ3 = Math.sqrt(3);

export class HexCoord {
  constructor(readonly q: number, readonly r: number) {}

  get s(): number { return -this.q - this.r; }

  key(): string { return `${this.q},${this.r}`; }

  static fromKey(key: string): HexCoord {
    const [q, r] = key.split(',').map(Number);
    return new HexCoord(q, r);
  }

  equals(other: HexCoord): boolean {
    return this.q === other.q && this.r === other.r;
  }

  toPixel(size: number): { x: number; y: number } {
    return {
      x: size * (SQ3 * this.q + (SQ3 / 2) * this.r),
      y: size * (1.5 * this.r),
    };
  }

  static fromPixel(x: number, y: number, size: number): HexCoord {
    const q = ((SQ3 / 3) * x - (1 / 3) * y) / size;
    const r = ((2 / 3) * y) / size;
    return HexCoord.round(q, r);
  }

  private static round(q: number, r: number): HexCoord {
    const s = -q - r;
    let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
    const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return new HexCoord(rq, rr);
  }

  neighbors(): HexCoord[] {
    return DIRS.map(([dq, dr]) => new HexCoord(this.q + dq, this.r + dr));
  }

  distance(other: HexCoord): number {
    return (Math.abs(this.q - other.q) +
            Math.abs(this.r - other.r) +
            Math.abs(this.s - other.s)) / 2;
  }

  range(radius: number): HexCoord[] {
    const out: HexCoord[] = [];
    for (let dq = -radius; dq <= radius; dq++) {
      const rMin = Math.max(-radius, -dq - radius);
      const rMax = Math.min(radius, -dq + radius);
      for (let dr = rMin; dr <= rMax; dr++) {
        out.push(new HexCoord(this.q + dq, this.r + dr));
      }
    }
    return out;
  }
}

const DIRS: [number, number][] = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

export function hexCorners(cx: number, cy: number, size: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
  });
}
```

- [ ] **Step 4: Create `lib/civ/HexEdge.ts`**

```ts
export class HexEdge {
  hasRiver = false;
  hasCliff = false;

  clone(): HexEdge {
    const e = new HexEdge();
    e.hasRiver = this.hasRiver;
    e.hasCliff = this.hasCliff;
    return e;
  }
}
```

- [ ] **Step 5: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/types.ts lib/civ/Stats.ts lib/civ/HexCoord.ts lib/civ/HexEdge.ts
git commit -m "feat(civ): foundation — types, Stats, HexCoord, HexEdge"
```

---

### Task 2: Requirement + Building + Placement abstract

**Files:**
- Create: `lib/civ/Requirement.ts`
- Create: `lib/civ/Building.ts`
- Create: `lib/civ/Placement.ts`

- [ ] **Step 1: Create `lib/civ/Requirement.ts`**

```ts
import type { HexTile } from './HexTile';
import type { GameMap } from './GameMap';
import { Terrain, isHills, isWater } from './types';

export interface Requirement {
  readonly description: string;
  isSatisfiedBy(tile: HexTile, map: GameMap): boolean;
}

export class RequireAdjacentMountain implements Requirement {
  readonly description = 'Adjacente a uma montanha';
  isSatisfiedBy(tile: HexTile, map: GameMap): boolean {
    return map.neighbors(tile.coord).some(n => n.terrain === Terrain.Mountain);
  }
}

export class RequireCoastal implements Requirement {
  readonly description = 'Adjacente a oceano ou costa';
  isSatisfiedBy(tile: HexTile, map: GameMap): boolean {
    return map.neighbors(tile.coord).some(n => isWater(n.terrain));
  }
}

export class RequireRiverAdjacent implements Requirement {
  readonly description = 'Tile com rio em alguma borda';
  isSatisfiedBy(tile: HexTile): boolean {
    return tile.edges.some(e => e.hasRiver);
  }
}

export class RequireFlat implements Requirement {
  readonly description = 'Terreno não pode ser colina ou montanha';
  isSatisfiedBy(tile: HexTile): boolean {
    return !isHills(tile.terrain) && tile.terrain !== Terrain.Mountain;
  }
}

export class RequireHills implements Requirement {
  readonly description = 'Terreno em colinas';
  isSatisfiedBy(tile: HexTile): boolean {
    return isHills(tile.terrain);
  }
}

export class RequireFreshWater implements Requirement {
  readonly description = 'Acesso a água fresca';
  isSatisfiedBy(tile: HexTile): boolean {
    return tile.hasFreshWater;
  }
}

export class RequireNotWater implements Requirement {
  readonly description = 'Não pode ser água';
  isSatisfiedBy(tile: HexTile): boolean {
    return !isWater(tile.terrain) && tile.terrain !== Terrain.Fog;
  }
}

export class RequireNoExistingPlacement implements Requirement {
  readonly description = 'Tile vazio (sem distrito ou maravilha)';
  isSatisfiedBy(tile: HexTile): boolean {
    return tile.placement === null;
  }
}
```

- [ ] **Step 2: Create `lib/civ/Building.ts`**

```ts
import { Stats } from './Stats';

export enum BuildingType {
  // City Center
  Monument = 'monument', Granary = 'granary', WaterMill = 'water_mill',
  AncientWalls = 'ancient_walls', MedievalWalls = 'medieval_walls', Palace = 'palace',
  // Campus
  Library = 'library', University = 'university', ResearchLab = 'research_lab',
  // Commercial Hub
  Market = 'market', Bank = 'bank', StockExchange = 'stock_exchange',
  // Holy Site
  Shrine = 'shrine', Temple = 'temple',
  // Industrial Zone
  Workshop = 'workshop', Factory = 'factory', PowerPlant = 'power_plant',
  // Theater Square
  Amphitheater = 'amphitheater', ArtMuseum = 'art_museum', ArchaeologicalMuseum = 'archaeological_museum',
  // Harbor
  Lighthouse = 'lighthouse', Shipyard = 'shipyard', Seaport = 'seaport',
  // Encampment
  Barracks = 'barracks', Armory = 'armory', MilitaryAcademy = 'military_academy',
  // Entertainment Complex
  Arena = 'arena', Zoo = 'zoo', Stadium = 'stadium',
}

export class Building {
  constructor(
    readonly type: BuildingType,
    readonly label: string,
    readonly stats: Stats,
  ) {}
}

export const BUILDING_DATA: Record<BuildingType, { label: string; stats: Stats }> = {
  [BuildingType.Monument]:               { label: 'Monumento',              stats: Stats.of({ culture: 2 }) },
  [BuildingType.Granary]:                { label: 'Celeiro',                stats: Stats.of({ food: 1, housing: 2 }) },
  [BuildingType.WaterMill]:              { label: 'Moinho de Água',         stats: Stats.of({ food: 1, production: 1, housing: 1 }) },
  [BuildingType.AncientWalls]:           { label: 'Muralhas Antigas',       stats: Stats.zero() },
  [BuildingType.MedievalWalls]:          { label: 'Muralhas Medievais',     stats: Stats.zero() },
  [BuildingType.Palace]:                 { label: 'Palácio',                stats: Stats.of({ food: 2, production: 2, gold: 5, science: 2, culture: 2, faith: 1, housing: 1 }) },
  [BuildingType.Library]:                { label: 'Biblioteca',             stats: Stats.of({ science: 2 }) },
  [BuildingType.University]:             { label: 'Universidade',           stats: Stats.of({ science: 4, housing: 1 }) },
  [BuildingType.ResearchLab]:            { label: 'Laboratório de Pesquisa', stats: Stats.of({ science: 5 }) },
  [BuildingType.Market]:                 { label: 'Mercado',                stats: Stats.of({ gold: 3 }) },
  [BuildingType.Bank]:                   { label: 'Banco',                  stats: Stats.of({ gold: 5 }) },
  [BuildingType.StockExchange]:          { label: 'Bolsa de Valores',       stats: Stats.of({ gold: 7 }) },
  [BuildingType.Shrine]:                 { label: 'Santuário',              stats: Stats.of({ faith: 2 }) },
  [BuildingType.Temple]:                 { label: 'Templo',                 stats: Stats.of({ faith: 4 }) },
  [BuildingType.Workshop]:               { label: 'Oficina',                stats: Stats.of({ production: 2 }) },
  [BuildingType.Factory]:                { label: 'Fábrica',                stats: Stats.of({ production: 4 }) },
  [BuildingType.PowerPlant]:             { label: 'Usina de Energia',       stats: Stats.of({ production: 4 }) },
  [BuildingType.Amphitheater]:           { label: 'Anfiteatro',             stats: Stats.of({ culture: 2 }) },
  [BuildingType.ArtMuseum]:              { label: 'Museu de Arte',          stats: Stats.of({ culture: 2 }) },
  [BuildingType.ArchaeologicalMuseum]:   { label: 'Museu Arqueológico',     stats: Stats.of({ culture: 2 }) },
  [BuildingType.Lighthouse]:             { label: 'Farol',                  stats: Stats.of({ food: 1, gold: 1, housing: 1 }) },
  [BuildingType.Shipyard]:               { label: 'Estaleiro',              stats: Stats.of({ production: 1, gold: 1 }) },
  [BuildingType.Seaport]:                { label: 'Porto',                  stats: Stats.of({ gold: 2, production: 2, housing: 1 }) },
  [BuildingType.Barracks]:               { label: 'Quartel',                stats: Stats.of({ production: 1, housing: 1 }) },
  [BuildingType.Armory]:                 { label: 'Armaria',                stats: Stats.of({ production: 2 }) },
  [BuildingType.MilitaryAcademy]:        { label: 'Academia Militar',       stats: Stats.of({ production: 3 }) },
  [BuildingType.Arena]:                  { label: 'Arena',                  stats: Stats.of({ amenities: 1, culture: 1 }) },
  [BuildingType.Zoo]:                    { label: 'Zoológico',              stats: Stats.of({ amenities: 1, science: 1 }) },
  [BuildingType.Stadium]:                { label: 'Estádio',                stats: Stats.of({ amenities: 2, culture: 3 }) },
};

export function makeBuilding(type: BuildingType): Building {
  const data = BUILDING_DATA[type];
  return new Building(type, data.label, data.stats.clone());
}
```

- [ ] **Step 3: Create `lib/civ/Placement.ts`**

```ts
import type { HexTile } from './HexTile';
import type { GameMap } from './GameMap';
import type { Requirement } from './Requirement';
import { Stats } from './Stats';

export abstract class Placement {
  abstract readonly name: string;
  abstract readonly color: string;
  abstract readonly requirements: Requirement[];

  canPlaceOn(tile: HexTile, map: GameMap): { ok: boolean; failed: string[] } {
    const failed: string[] = [];
    for (const req of this.requirements) {
      if (!req.isSatisfiedBy(tile, map)) failed.push(req.description);
    }
    return { ok: failed.length === 0, failed };
  }

  abstract getEffect(tile: HexTile, map: GameMap): Stats;
}
```

- [ ] **Step 4: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/Requirement.ts lib/civ/Building.ts lib/civ/Placement.ts
git commit -m "feat(civ): Requirement, Building, Placement abstract"
```

---

### Task 3: District concrete + DistrictFactory + adjacency rules

**Files:**
- Create: `lib/civ/District.ts`

- [ ] **Step 1: Create `lib/civ/District.ts`** with all 15 concrete districts and Civ VI adjacency rules.

```ts
import type { HexTile } from './HexTile';
import type { GameMap } from './GameMap';
import { Placement } from './Placement';
import { Stats } from './Stats';
import { Building, BuildingType, makeBuilding } from './Building';
import {
  Requirement, RequireNoExistingPlacement, RequireNotWater, RequireCoastal,
  RequireFreshWater, RequireFlat,
} from './Requirement';
import { DistrictType, Terrain, Resource, Feature, isHills } from './types';

interface DistrictMeta {
  type: DistrictType;
  name: string;
  color: string;
  abbr: string;
  buildings: BuildingType[];
}

const DISTRICT_META: Record<DistrictType, DistrictMeta> = {
  [DistrictType.CityCenter]:           { type: DistrictType.CityCenter,           name: 'Centro da Cidade',         color: '#c0392b', abbr: 'CC', buildings: [BuildingType.Monument, BuildingType.Granary, BuildingType.WaterMill, BuildingType.AncientWalls, BuildingType.MedievalWalls, BuildingType.Palace] },
  [DistrictType.Campus]:               { type: DistrictType.Campus,               name: 'Campus',                   color: '#2980b9', abbr: 'CA', buildings: [BuildingType.Library, BuildingType.University, BuildingType.ResearchLab] },
  [DistrictType.CommercialHub]:        { type: DistrictType.CommercialHub,        name: 'Hub Comercial',            color: '#f39c12', abbr: 'HC', buildings: [BuildingType.Market, BuildingType.Bank, BuildingType.StockExchange] },
  [DistrictType.HolySite]:             { type: DistrictType.HolySite,             name: 'Local Sagrado',            color: '#e8d44d', abbr: 'LS', buildings: [BuildingType.Shrine, BuildingType.Temple] },
  [DistrictType.IndustrialZone]:       { type: DistrictType.IndustrialZone,       name: 'Zona Industrial',          color: '#e67e22', abbr: 'ZI', buildings: [BuildingType.Workshop, BuildingType.Factory, BuildingType.PowerPlant] },
  [DistrictType.TheaterSquare]:        { type: DistrictType.TheaterSquare,        name: 'Praça do Teatro',          color: '#8e44ad', abbr: 'PT', buildings: [BuildingType.Amphitheater, BuildingType.ArtMuseum, BuildingType.ArchaeologicalMuseum] },
  [DistrictType.Harbor]:               { type: DistrictType.Harbor,               name: 'Porto',                    color: '#1a8fad', abbr: 'PO', buildings: [BuildingType.Lighthouse, BuildingType.Shipyard, BuildingType.Seaport] },
  [DistrictType.Encampment]:           { type: DistrictType.Encampment,           name: 'Acampamento',              color: '#7f8c8d', abbr: 'AC', buildings: [BuildingType.Barracks, BuildingType.Armory, BuildingType.MilitaryAcademy] },
  [DistrictType.EntertainmentComplex]: { type: DistrictType.EntertainmentComplex, name: 'Complexo Entretenimento',  color: '#9b59b6', abbr: 'CE', buildings: [BuildingType.Arena, BuildingType.Zoo, BuildingType.Stadium] },
  [DistrictType.Aqueduct]:             { type: DistrictType.Aqueduct,             name: 'Aqueduto',                 color: '#27ae60', abbr: 'AQ', buildings: [] },
  [DistrictType.Dam]:                  { type: DistrictType.Dam,                  name: 'Represa',                  color: '#2ecc71', abbr: 'RE', buildings: [] },
  [DistrictType.Neighborhood]:         { type: DistrictType.Neighborhood,         name: 'Bairro',                   color: '#795548', abbr: 'BA', buildings: [] },
  [DistrictType.Aerodrome]:            { type: DistrictType.Aerodrome,            name: 'Aeródromo',                color: '#607d8b', abbr: 'AE', buildings: [] },
  [DistrictType.Spaceport]:            { type: DistrictType.Spaceport,            name: 'Cosmódromo',               color: '#546e7a', abbr: 'CS', buildings: [] },
  [DistrictType.GovernmentPlaza]:      { type: DistrictType.GovernmentPlaza,      name: 'Praça do Governo',         color: '#b7950b', abbr: 'PG', buildings: [] },
};

export abstract class District extends Placement {
  abstract readonly type: DistrictType;
  buildings: Building[] = [];

  get meta(): DistrictMeta { return DISTRICT_META[this.type]; }
  get name(): string { return this.meta.name; }
  get color(): string { return this.meta.color; }
  get abbr(): string { return this.meta.abbr; }
  get availableBuildings(): BuildingType[] { return this.meta.buildings; }

  addBuilding(type: BuildingType): boolean {
    if (!this.availableBuildings.includes(type)) return false;
    if (this.buildings.some(b => b.type === type)) return false;
    this.buildings.push(makeBuilding(type));
    return true;
  }

  removeBuilding(type: BuildingType): void {
    this.buildings = this.buildings.filter(b => b.type !== type);
  }

  hasBuilding(type: BuildingType): boolean {
    return this.buildings.some(b => b.type === type);
  }

  buildingsStats(): Stats {
    const s = Stats.zero();
    for (const b of this.buildings) s.add(b.stats);
    return s;
  }

  // Default requirements: tile must be empty + not water
  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireNotWater(),
  ];

  abstract getAdjacencyBonus(tile: HexTile, map: GameMap): Stats;

  getEffect(tile: HexTile, map: GameMap): Stats {
    return this.buildingsStats().add(this.getAdjacencyBonus(tile, map));
  }
}

// --- Concrete districts ---

export class CityCenter extends District { readonly type = DistrictType.CityCenter;
  getAdjacencyBonus(): Stats { return Stats.of({ housing: 2 }); }
}

export class Campus extends District { readonly type = DistrictType.Campus;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    let s = 0;
    s += ns.filter(n => n.terrain === Terrain.Mountain).length * 1;        // +1/mountain
    s += Math.floor(ns.filter(n => n.feature === Feature.Forest || n.feature === Feature.Rainforest).length / 2);
    s += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ science: s });
  }
}

export class CommercialHub extends District { readonly type = DistrictType.CommercialHub;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    let g = 0;
    if (tile.edges.some(e => e.hasRiver)) g += 2;                          // +2 river
    if (ns.some(n => n.placement instanceof Harbor)) g += 2;              // +2 harbor
    g += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ gold: g });
  }
}

export class HolySite extends District { readonly type = DistrictType.HolySite;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    let f = 0;
    f += ns.filter(n => n.terrain === Terrain.Mountain).length;
    f += Math.floor(ns.filter(n => n.feature === Feature.Forest || n.feature === Feature.Rainforest).length / 2);
    f += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ faith: f });
  }
}

export class IndustrialZone extends District { readonly type = DistrictType.IndustrialZone;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    let p = 0;
    p += ns.filter(n => n.placement instanceof Aqueduct || n.placement instanceof Dam).length * 2;
    p += ns.filter(n => isHills(n.terrain)).length;                       // approximation: +1/mine via hills
    p += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ production: p });
  }
}

export class TheaterSquare extends District { readonly type = DistrictType.TheaterSquare;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    const wonderCount = ns.filter(n => n.placement && !(n.placement instanceof District)).length;
    let c = wonderCount * 2;
    c += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ culture: c });
  }
}

export class Harbor extends District { readonly type = DistrictType.Harbor;
  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireCoastal(),
  ];
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    let g = 0;
    if (ns.some(n => n.placement instanceof CityCenter)) g += 2;
    g += Math.floor(ns.filter(n => n.resource !== Resource.None).length / 2);
    g += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ gold: g });
  }
}

export class Encampment extends District { readonly type = DistrictType.Encampment;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    const strategic = new Set<Resource>([Resource.Horses, Resource.Iron, Resource.Niter, Resource.Coal, Resource.Oil, Resource.Aluminum, Resource.Uranium]);
    let p = ns.filter(n => strategic.has(n.resource)).length;
    p += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ production: p });
  }
}

export class EntertainmentComplex extends District { readonly type = DistrictType.EntertainmentComplex;
  getAdjacencyBonus(): Stats { return Stats.zero(); }
}

export class Aqueduct extends District { readonly type = DistrictType.Aqueduct;
  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireNotWater(),
  ];
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    return ns.some(n => n.placement instanceof CityCenter)
      ? Stats.of({ housing: 6 })
      : Stats.zero();
  }
}

export class Dam extends District { readonly type = DistrictType.Dam;
  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireFlat(),
  ];
  getAdjacencyBonus(): Stats { return Stats.of({ amenities: 1, housing: 2 }); }
}

export class Neighborhood extends District { readonly type = DistrictType.Neighborhood;
  getAdjacencyBonus(tile: HexTile): Stats {
    const appeal = tile.appeal ?? 0;
    let h = 0;
    if (appeal >= 4) h = 6;
    else if (appeal >= 2) h = 5;
    else if (appeal >= 0) h = 4;
    else if (appeal >= -2) h = 3;
    else h = 2;
    return Stats.of({ housing: h });
  }
}

export class Aerodrome extends District { readonly type = DistrictType.Aerodrome;
  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireFlat(),
  ];
  getAdjacencyBonus(): Stats { return Stats.zero(); }
}

export class Spaceport extends District { readonly type = DistrictType.Spaceport;
  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireFlat(),
  ];
  getAdjacencyBonus(): Stats { return Stats.zero(); }
}

export class GovernmentPlaza extends District { readonly type = DistrictType.GovernmentPlaza;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    const adj = ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length;
    return Stats.of({ production: adj, gold: adj });
  }
}

export class DistrictFactory {
  static create(type: DistrictType): District {
    switch (type) {
      case DistrictType.CityCenter:           return new CityCenter();
      case DistrictType.Campus:               return new Campus();
      case DistrictType.CommercialHub:        return new CommercialHub();
      case DistrictType.HolySite:             return new HolySite();
      case DistrictType.IndustrialZone:       return new IndustrialZone();
      case DistrictType.TheaterSquare:        return new TheaterSquare();
      case DistrictType.Harbor:               return new Harbor();
      case DistrictType.Encampment:           return new Encampment();
      case DistrictType.EntertainmentComplex: return new EntertainmentComplex();
      case DistrictType.Aqueduct:             return new Aqueduct();
      case DistrictType.Dam:                  return new Dam();
      case DistrictType.Neighborhood:         return new Neighborhood();
      case DistrictType.Aerodrome:            return new Aerodrome();
      case DistrictType.Spaceport:            return new Spaceport();
      case DistrictType.GovernmentPlaza:      return new GovernmentPlaza();
    }
  }

  static all(): District[] {
    return Object.values(DistrictType).map(t => DistrictFactory.create(t as DistrictType));
  }
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/District.ts
git commit -m "feat(civ): District abstract + 15 concrete subclasses with adjacency rules"
```

---

### Task 4: Wonder concrete + WonderFactory

**Files:**
- Create: `lib/civ/Wonder.ts`

- [ ] **Step 1: Create `lib/civ/Wonder.ts`**

```ts
import { Placement } from './Placement';
import { Stats } from './Stats';
import {
  Requirement, RequireNoExistingPlacement, RequireNotWater,
  RequireRiverAdjacent, RequireFlat, RequireHills, RequireCoastal,
} from './Requirement';
import { WonderType } from './types';

interface WonderData {
  type: WonderType;
  name: string;
  era: string;
  color: string;
  effect: Stats;
  extraReqs: Requirement[];
}

export const WONDER_DATA: Record<WonderType, WonderData> = {
  [WonderType.Pyramids]:        { type: WonderType.Pyramids,        name: 'Pirâmides',          era: 'Antiga',     color: '#c8a031', effect: Stats.of({ culture: 2 }), extraReqs: [] },
  [WonderType.Stonehenge]:      { type: WonderType.Stonehenge,      name: 'Stonehenge',         era: 'Antiga',     color: '#9e9e9e', effect: Stats.of({ faith: 2 }), extraReqs: [new RequireFlat()] },
  [WonderType.HangingGardens]:  { type: WonderType.HangingGardens,  name: 'Jardins Suspensos',  era: 'Antiga',     color: '#66bb6a', effect: Stats.of({ food: 2, housing: 2 }), extraReqs: [new RequireRiverAdjacent()] },
  [WonderType.GreatLibrary]:    { type: WonderType.GreatLibrary,    name: 'Grande Biblioteca',  era: 'Clássica',   color: '#f5e642', effect: Stats.of({ science: 2 }), extraReqs: [] },
  [WonderType.Oracle]:          { type: WonderType.Oracle,          name: 'Oráculo',            era: 'Clássica',   color: '#a8c8e8', effect: Stats.of({ culture: 1, faith: 1 }), extraReqs: [new RequireHills()] },
  [WonderType.Colosseum]:       { type: WonderType.Colosseum,       name: 'Coliseu',            era: 'Clássica',   color: '#e0c060', effect: Stats.of({ culture: 3, amenities: 3 }), extraReqs: [] },
  [WonderType.Petra]:           { type: WonderType.Petra,           name: 'Petra',              era: 'Clássica',   color: '#e8b070', effect: Stats.of({ food: 2, gold: 2, culture: 1 }), extraReqs: [] },
  [WonderType.HagiaSophia]:     { type: WonderType.HagiaSophia,     name: 'Hagia Sophia',       era: 'Medieval',   color: '#e8c89a', effect: Stats.of({ faith: 4 }), extraReqs: [] },
  [WonderType.MachuPicchu]:     { type: WonderType.MachuPicchu,     name: 'Machu Picchu',       era: 'Medieval',   color: '#8fbc8f', effect: Stats.of({ gold: 4, production: 2 }), extraReqs: [new RequireHills()] },
  [WonderType.ChichenItza]:     { type: WonderType.ChichenItza,     name: 'Chichén Itzá',       era: 'Medieval',   color: '#c8a850', effect: Stats.of({ culture: 2, production: 2 }), extraReqs: [] },
  [WonderType.ForbiddenCity]:   { type: WonderType.ForbiddenCity,   name: 'Cidade Proibida',    era: 'Renascença', color: '#8b0000', effect: Stats.of({ culture: 5 }), extraReqs: [] },
  [WonderType.TajMahal]:        { type: WonderType.TajMahal,        name: 'Taj Mahal',          era: 'Renascença', color: '#f8f8f8', effect: Stats.of({ culture: 4 }), extraReqs: [new RequireRiverAdjacent()] },
  [WonderType.Versailles]:      { type: WonderType.Versailles,      name: 'Palácio de Versalhes', era: 'Renascença', color: '#ffd700', effect: Stats.of({ culture: 3 }), extraReqs: [] },
  [WonderType.BigBen]:          { type: WonderType.BigBen,          name: 'Big Ben',            era: 'Industrial', color: '#a0a0a0', effect: Stats.of({ gold: 6, culture: 2 }), extraReqs: [new RequireRiverAdjacent()] },
  [WonderType.EiffelTower]:     { type: WonderType.EiffelTower,     name: 'Torre Eiffel',       era: 'Moderna',    color: '#b0b0b0', effect: Stats.of({ appeal: 2, culture: 2 }), extraReqs: [] },
  [WonderType.StatueOfLiberty]: { type: WonderType.StatueOfLiberty, name: 'Estátua da Liberdade', era: 'Moderna',  color: '#78a878', effect: Stats.of({ culture: 4 }), extraReqs: [new RequireCoastal()] },
  [WonderType.CristoRedentor]:  { type: WonderType.CristoRedentor,  name: 'Cristo Redentor',    era: 'Moderna',    color: '#e0e0e0', effect: Stats.of({ culture: 4, faith: 4 }), extraReqs: [] },
};

export class Wonder extends Placement {
  constructor(readonly type: WonderType) { super(); }

  get data(): WonderData { return WONDER_DATA[this.type]; }
  get name(): string { return this.data.name; }
  get era(): string { return this.data.era; }
  get color(): string { return this.data.color; }

  get requirements(): Requirement[] {
    return [new RequireNoExistingPlacement(), new RequireNotWater(), ...this.data.extraReqs];
  }

  getEffect(): Stats { return this.data.effect.clone(); }
}

export class WonderFactory {
  static create(type: WonderType): Wonder { return new Wonder(type); }
  static all(): Wonder[] {
    return Object.values(WonderType).map(t => new Wonder(t as WonderType));
  }
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/Wonder.ts
git commit -m "feat(civ): Wonder concrete + WonderFactory + WONDER_DATA (17 wonders)"
```

---

### Task 5: HexTile

**Files:**
- Create: `lib/civ/HexTile.ts`

- [ ] **Step 1: Create `lib/civ/HexTile.ts`**

```ts
import { HexCoord } from './HexCoord';
import { HexEdge } from './HexEdge';
import { Stats } from './Stats';
import { Placement } from './Placement';
import { Terrain, Feature, Resource, isHills, isWater } from './types';
import type { GameMap } from './GameMap';

const TERRAIN_BASE: Record<Terrain, Stats> = {
  [Terrain.Fog]:            Stats.zero(),
  [Terrain.Ocean]:          Stats.of({ food: 1 }),
  [Terrain.Coast]:          Stats.of({ food: 1, gold: 1 }),
  [Terrain.Grassland]:      Stats.of({ food: 2 }),
  [Terrain.GrasslandHills]: Stats.of({ food: 2, production: 1 }),
  [Terrain.Plains]:         Stats.of({ food: 1, production: 1 }),
  [Terrain.PlainsHills]:    Stats.of({ food: 1, production: 2 }),
  [Terrain.Desert]:         Stats.zero(),
  [Terrain.DesertHills]:    Stats.of({ production: 1 }),
  [Terrain.Tundra]:         Stats.of({ food: 1 }),
  [Terrain.TundraHills]:    Stats.of({ food: 1, production: 1 }),
  [Terrain.Snow]:           Stats.zero(),
  [Terrain.SnowHills]:      Stats.of({ production: 1 }),
  [Terrain.Mountain]:       Stats.zero(),
};

const FEATURE_BASE: Record<Feature, Stats> = {
  [Feature.None]:        Stats.zero(),
  [Feature.Forest]:      Stats.of({ production: 1, appeal: 1 }),
  [Feature.Rainforest]:  Stats.of({ food: 1, appeal: -1 }),
  [Feature.Marsh]:       Stats.of({ food: 1, appeal: -1 }),
  [Feature.Floodplains]: Stats.of({ food: 3 }),
  [Feature.Oasis]:       Stats.of({ food: 3, gold: 1 }),
  [Feature.Reef]:        Stats.of({ food: 1, production: 1, appeal: 2 }),
  [Feature.Ice]:         Stats.zero(),
};

const RESOURCE_BASE: Record<Resource, Stats> = {
  [Resource.None]:     Stats.zero(),
  [Resource.Wheat]:    Stats.of({ food: 1 }),
  [Resource.Rice]:     Stats.of({ food: 1 }),
  [Resource.Cattle]:   Stats.of({ food: 1 }),
  [Resource.Sheep]:    Stats.of({ food: 1 }),
  [Resource.Deer]:     Stats.of({ food: 1 }),
  [Resource.Bananas]:  Stats.of({ food: 1 }),
  [Resource.Fish]:     Stats.of({ food: 1 }),
  [Resource.Crabs]:    Stats.of({ food: 1 }),
  [Resource.Stone]:    Stats.of({ production: 1 }),
  [Resource.Copper]:   Stats.of({ gold: 2 }),
  [Resource.Wine]:     Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Silk]:     Stats.of({ culture: 1, amenities: 1 }),
  [Resource.Citrus]:   Stats.of({ food: 2, amenities: 1 }),
  [Resource.Cotton]:   Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Diamonds]: Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Furs]:     Stats.of({ food: 1, gold: 2, amenities: 1 }),
  [Resource.Ivory]:    Stats.of({ production: 1, gold: 2, amenities: 1 }),
  [Resource.Jade]:     Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Pearls]:   Stats.of({ faith: 2, amenities: 1 }),
  [Resource.Salt]:     Stats.of({ food: 1, gold: 2, amenities: 1 }),
  [Resource.Silver]:   Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Spices]:   Stats.of({ food: 2, amenities: 1 }),
  [Resource.Sugar]:    Stats.of({ food: 2, amenities: 1 }),
  [Resource.Tea]:      Stats.of({ science: 1, amenities: 1 }),
  [Resource.Tobacco]:  Stats.of({ faith: 1, gold: 2, amenities: 1 }),
  [Resource.Truffles]: Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Horses]:   Stats.of({ food: 1, production: 1 }),
  [Resource.Iron]:     Stats.of({ science: 1, production: 1 }),
  [Resource.Niter]:    Stats.of({ food: 1, production: 1 }),
  [Resource.Coal]:     Stats.of({ production: 2 }),
  [Resource.Oil]:      Stats.of({ production: 3 }),
  [Resource.Aluminum]: Stats.of({ science: 1, production: 1 }),
  [Resource.Uranium]:  Stats.of({ production: 2 }),
};

export class HexTile {
  readonly coord: HexCoord;
  terrain: Terrain;
  feature: Feature = Feature.None;
  resource: Resource = Resource.None;
  placement: Placement | null = null;
  edges: HexEdge[] = Array.from({ length: 6 }, () => new HexEdge());
  hasFreshWater: boolean = false;

  constructor(coord: HexCoord, terrain: Terrain = Terrain.Fog) {
    this.coord = coord;
    this.terrain = terrain;
  }

  get q(): number { return this.coord.q; }
  get r(): number { return this.coord.r; }
  get isFog(): boolean { return this.terrain === Terrain.Fog; }
  get isHills(): boolean { return isHills(this.terrain); }
  get isWater(): boolean { return isWater(this.terrain); }

  get appeal(): number { return this.getBaseStats().appeal; }

  getBaseStats(): Stats {
    return TERRAIN_BASE[this.terrain].clone()
      .add(FEATURE_BASE[this.feature])
      .add(RESOURCE_BASE[this.resource]);
  }

  getFinalStats(map: GameMap): Stats {
    const s = this.getBaseStats();
    if (this.placement) s.add(this.placement.getEffect(this, map));
    return s;
  }

  clone(): HexTile {
    const t = new HexTile(this.coord, this.terrain);
    t.feature = this.feature;
    t.resource = this.resource;
    t.placement = this.placement;
    t.edges = this.edges.map(e => e.clone());
    t.hasFreshWater = this.hasFreshWater;
    return t;
  }
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/HexTile.ts
git commit -m "feat(civ): HexTile composition + base yields"
```

---

### Task 6: GameMap + fog auto-expansion

**Files:**
- Create: `lib/civ/GameMap.ts`

- [ ] **Step 1: Create `lib/civ/GameMap.ts`**

```ts
import { HexCoord } from './HexCoord';
import { HexTile } from './HexTile';
import { Terrain } from './types';

export class GameMap {
  hexes: Map<string, HexTile> = new Map();

  getTile(coord: HexCoord): HexTile | undefined {
    return this.hexes.get(coord.key());
  }

  getOrUndefined(key: string): HexTile | undefined {
    return this.hexes.get(key);
  }

  setTile(tile: HexTile): void {
    this.hexes.set(tile.coord.key(), tile);
  }

  removeTile(coord: HexCoord): HexTile | undefined {
    const t = this.hexes.get(coord.key());
    if (t) this.hexes.delete(coord.key());
    return t;
  }

  hasTile(coord: HexCoord): boolean {
    return this.hexes.has(coord.key());
  }

  neighbors(coord: HexCoord): HexTile[] {
    return coord.neighbors()
      .map(n => this.hexes.get(n.key()))
      .filter((t): t is HexTile => t !== undefined);
  }

  allTiles(): HexTile[] { return [...this.hexes.values()]; }

  size(): number { return this.hexes.size; }

  /**
   * Returns coords of newly created fog tiles when expanding from `coord`.
   * Caller is responsible for actually setting them via setTile (so the
   * Action layer can record what was created and revert it on undo).
   */
  computeFogExpansion(coord: HexCoord, radius: number = 2): HexCoord[] {
    const created: HexCoord[] = [];
    for (const c of coord.range(radius)) {
      if (!this.hasTile(c)) created.push(c);
    }
    return created;
  }

  static initial(): GameMap {
    const m = new GameMap();
    const center = new HexCoord(0, 0);
    for (const c of center.range(2)) {
      m.setTile(new HexTile(c, Terrain.Fog));
    }
    return m;
  }
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/GameMap.ts
git commit -m "feat(civ): GameMap + fog expansion compute helper"
```

---

### Task 7: Action + HistoryManager (Command pattern)

**Files:**
- Create: `lib/civ/Action.ts`
- Create: `lib/civ/HistoryManager.ts`

- [ ] **Step 1: Create `lib/civ/Action.ts`**

```ts
import { HexCoord } from './HexCoord';
import { HexTile } from './HexTile';
import { GameMap } from './GameMap';
import { Terrain, Feature, Resource } from './types';
import { Placement } from './Placement';

export interface Action {
  readonly description: string;
  apply(map: GameMap): void;
  revert(map: GameMap): void;
}

export class SetTerrainAction implements Action {
  readonly description: string;
  private prev?: Terrain;
  constructor(readonly coord: HexCoord, readonly next: Terrain) {
    this.description = `Terreno → ${next}`;
  }
  apply(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (!t) return;
    this.prev = t.terrain;
    t.terrain = this.next;
  }
  revert(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (t && this.prev !== undefined) t.terrain = this.prev;
  }
}

export class SetFeatureAction implements Action {
  readonly description: string;
  private prev?: Feature;
  constructor(readonly coord: HexCoord, readonly next: Feature) {
    this.description = `Característica → ${next}`;
  }
  apply(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (!t) return;
    this.prev = t.feature;
    t.feature = this.next;
  }
  revert(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (t && this.prev !== undefined) t.feature = this.prev;
  }
}

export class SetResourceAction implements Action {
  readonly description: string;
  private prev?: Resource;
  constructor(readonly coord: HexCoord, readonly next: Resource) {
    this.description = `Recurso → ${next}`;
  }
  apply(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (!t) return;
    this.prev = t.resource;
    t.resource = this.next;
  }
  revert(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (t && this.prev !== undefined) t.resource = this.prev;
  }
}

export class SetPlacementAction implements Action {
  readonly description: string;
  private prev: Placement | null = null;
  constructor(readonly coord: HexCoord, readonly next: Placement | null) {
    this.description = next ? `Posicionar ${next.name}` : 'Remover posicionamento';
  }
  apply(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (!t) return;
    this.prev = t.placement;
    t.placement = this.next;
  }
  revert(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (t) t.placement = this.prev;
  }
}

export class CreateTileAction implements Action {
  readonly description: string;
  private prev?: HexTile;
  constructor(readonly tile: HexTile) {
    this.description = `Criar tile (${tile.q},${tile.r})`;
  }
  apply(map: GameMap): void {
    this.prev = map.getTile(this.tile.coord);
    map.setTile(this.tile);
  }
  revert(map: GameMap): void {
    if (this.prev) map.setTile(this.prev);
    else map.removeTile(this.tile.coord);
  }
}

/**
 * Activate a fog tile: change its terrain AND spawn fog neighbors in radius 2.
 * On revert: restore previous terrain AND remove the spawned neighbors.
 */
export class FogActivateAction implements Action {
  readonly description: string;
  private prevTerrain?: Terrain;
  private spawnedKeys: string[] = [];
  constructor(readonly coord: HexCoord, readonly nextTerrain: Terrain) {
    this.description = `Ativar névoa → ${nextTerrain}`;
  }
  apply(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (!t) return;
    this.prevTerrain = t.terrain;
    t.terrain = this.nextTerrain;
    const created = map.computeFogExpansion(this.coord, 2);
    this.spawnedKeys = created.map(c => c.key());
    for (const c of created) map.setTile(new HexTile(c, Terrain.Fog));
  }
  revert(map: GameMap): void {
    const t = map.getTile(this.coord);
    if (t && this.prevTerrain !== undefined) t.terrain = this.prevTerrain;
    for (const k of this.spawnedKeys) map.removeTile(HexCoord.fromKey(k));
  }
}

export class CompositeAction implements Action {
  readonly description: string;
  constructor(readonly children: Action[], description?: string) {
    this.description = description ?? children.map(a => a.description).join(' + ');
  }
  apply(map: GameMap): void {
    for (const a of this.children) a.apply(map);
  }
  revert(map: GameMap): void {
    for (let i = this.children.length - 1; i >= 0; i--) this.children[i].revert(map);
  }
}
```

- [ ] **Step 2: Create `lib/civ/HistoryManager.ts`**

```ts
import { Action } from './Action';
import { GameMap } from './GameMap';

export class HistoryManager {
  private stack: Action[] = [];
  readonly maxSteps = 25;

  push(action: Action, map: GameMap): void {
    action.apply(map);
    this.stack.push(action);
    if (this.stack.length > this.maxSteps) this.stack.shift();
  }

  undo(map: GameMap): Action | null {
    const a = this.stack.pop();
    if (!a) return null;
    a.revert(map);
    return a;
  }

  canUndo(): boolean { return this.stack.length > 0; }
  size(): number { return this.stack.length; }
  peek(): Action | undefined { return this.stack[this.stack.length - 1]; }
  clear(): void { this.stack = []; }
}
```

- [ ] **Step 3: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/Action.ts lib/civ/HistoryManager.ts
git commit -m "feat(civ): Command pattern — Action + HistoryManager (max 25)"
```

---

### Task 8: PlayerContext stub + GameMap wiring

**Files:**
- Create: `lib/civ/PlayerContext.ts`
- Modify: `lib/civ/GameMap.ts` (add playerContext + history fields)

- [ ] **Step 1: Create `lib/civ/PlayerContext.ts`**

```ts
export enum Civilization {
  None = 'none',
  Brazil = 'brazil',
  Rome = 'rome',
  Egypt = 'egypt',
  Greece = 'greece',
  China = 'china',
  Japan = 'japan',
  America = 'america',
}

export enum Policy {
  None = 'none',
  UrbanPlanning = 'urban_planning',
  GodKing = 'god_king',
  ColonialOffices = 'colonial_offices',
}

export enum Tech {
  None = 'none',
  Pottery = 'pottery',
  Writing = 'writing',
  Sailing = 'sailing',
  Engineering = 'engineering',
}

export class PlayerContext {
  civ: Civilization = Civilization.None;
  activePolicies: Policy[] = [];
  unlockedTechs: Tech[] = [];

  hasPolicy(p: Policy): boolean { return this.activePolicies.includes(p); }
  hasTech(t: Tech): boolean { return this.unlockedTechs.includes(t); }
}
```

- [ ] **Step 2: Modify `lib/civ/GameMap.ts`**: add `playerContext` and `history` fields. Replace the top of the file with:

```ts
import { HexCoord } from './HexCoord';
import { HexTile } from './HexTile';
import { Terrain } from './types';
import { PlayerContext } from './PlayerContext';
import { HistoryManager } from './HistoryManager';
import { Action } from './Action';

export class GameMap {
  hexes: Map<string, HexTile> = new Map();
  playerContext: PlayerContext = new PlayerContext();
  history: HistoryManager = new HistoryManager();

  /** Push an action through the history stack. */
  perform(action: Action): void {
    this.history.push(action, this);
  }

  /** Undo last action. Returns true if something was undone. */
  undo(): boolean {
    return this.history.undo(this) !== null;
  }
```

(Keep the rest of the file — `getTile`, `setTile`, etc. — unchanged.)

- [ ] **Step 3: TypeScript check + commit**

```bash
npx tsc --noEmit
git add lib/civ/PlayerContext.ts lib/civ/GameMap.ts
git commit -m "feat(civ): PlayerContext + GameMap.perform/undo wiring"
```

---

### Task 9: Refactor existing canvas to use GameMap

**Files:**
- Delete: `app/mapa/HexGrid.tsx` (replaced)
- Create: `app/mapa/HexCanvas.tsx`
- Create: `app/mapa/MapEditor.tsx`
- Modify: `app/mapa/page.tsx`

- [ ] **Step 1: Delete the prototype**

```bash
git rm app/mapa/HexGrid.tsx
```

- [ ] **Step 2: Create `app/mapa/MapEditor.tsx`** — owns the GameMap and tool state.

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { GameMap } from '@/lib/civ/GameMap';
import { HexCoord } from '@/lib/civ/HexCoord';
import { ToolId } from '@/lib/civ/types';
import { HexCanvas } from './HexCanvas';

export type ToolState =
  | { id: ToolId.Select }
  | { id: ToolId.Pan }
  | { id: ToolId.Erase }
  | { id: ToolId.Fog }
  | { id: ToolId.Terrain;  payload: import('@/lib/civ/types').Terrain }
  | { id: ToolId.Feature;  payload: import('@/lib/civ/types').Feature }
  | { id: ToolId.Resource; payload: import('@/lib/civ/types').Resource }
  | { id: ToolId.District; payload: import('@/lib/civ/types').DistrictType }
  | { id: ToolId.Wonder;   payload: import('@/lib/civ/types').WonderType }
  | { id: ToolId.River };

export function MapEditor() {
  const mapRef = useRef<GameMap>(GameMap.initial());
  const [tool, setTool] = useState<ToolState>({ id: ToolId.Select });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion(v => v + 1), []);

  const handleTileClick = useCallback((coord: HexCoord) => {
    setSelectedKey(coord.key());
  }, []);

  return (
    <div className="w-screen h-screen bg-[var(--civ-blue-950)] relative overflow-hidden">
      <HexCanvas
        map={mapRef.current}
        version={version}
        selectedKey={selectedKey}
        tool={tool}
        onTileClick={handleTileClick}
        onMutate={bump}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/mapa/HexCanvas.tsx`** — pure renderer with pan/zoom/click. Reads `map.allTiles()`.

```tsx
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameMap } from '@/lib/civ/GameMap';
import { HexCoord, hexCorners } from '@/lib/civ/HexCoord';
import { TERRAIN_COLORS, Terrain, ToolId } from '@/lib/civ/types';
import { District } from '@/lib/civ/District';
import { Wonder } from '@/lib/civ/Wonder';
import type { ToolState } from './MapEditor';

const SIZE = 38;

interface Props {
  map: GameMap;
  version: number;
  selectedKey: string | null;
  tool: ToolState;
  onTileClick: (coord: HexCoord) => void;
  onMutate: () => void;
}

type Transform = { scale: number; tx: number; ty: number };

export function HexCanvas({ map, version, selectedKey, tool, onTileClick, onMutate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tf = useRef<Transform>({ scale: 1, tx: 0, ty: 0 });
  const hov = useRef<string | null>(null);
  const drag = useRef<{ sx: number; sy: number; stx: number; sty: number } | null>(null);
  const didDrag = useRef(false);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const { scale, tx, ty } = tf.current;

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, tx, ty);

    for (const tile of map.allTiles()) {
      const { x, y } = tile.coord.toPixel(SIZE);
      const cs = hexCorners(x, y, SIZE - 1);
      const key = tile.coord.key();
      const isSel = key === selectedKey;
      const isHov = key === hov.current;

      ctx.beginPath();
      ctx.moveTo(cs[0][0], cs[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(cs[i][0], cs[i][1]);
      ctx.closePath();

      ctx.fillStyle = TERRAIN_COLORS[tile.terrain];
      ctx.fill();

      if (tile.terrain === Terrain.Fog) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();
      }
      if (isSel) {
        ctx.fillStyle = 'rgba(218,183,103,0.30)';
        ctx.fill();
      } else if (isHov) {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fill();
      }

      ctx.strokeStyle = isSel ? '#dab767' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.stroke();

      if (tile.placement instanceof District) {
        ctx.fillStyle = tile.placement.color;
        ctx.font = `bold ${SIZE * 0.4}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.placement.abbr, x, y);
      } else if (tile.placement instanceof Wonder) {
        ctx.fillStyle = tile.placement.color;
        ctx.font = `${SIZE * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x, y);
      }
    }

    ctx.restore();
  }, [map, selectedKey, version]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
      if (tf.current.tx === 0 && tf.current.ty === 0) {
        tf.current = { scale: 1, tx: c.width / 2, ty: c.height / 2 };
      }
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    resize();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { scale, tx, ty } = tf.current;
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const ns = Math.max(0.25, Math.min(5, scale * f));
      tf.current = {
        scale: ns,
        tx: cx - (cx - tx) * (ns / scale),
        ty: cy - (cy - ty) * (ns / scale),
      };
      draw();
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [draw]);

  const worldPos = (cx: number, cy: number) => {
    const { scale, tx, ty } = tf.current;
    return { x: (cx - tx) / scale, y: (cy - ty) / scale };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || tool.id === ToolId.Pan) {
      drag.current = { sx: e.clientX, sy: e.clientY, stx: tf.current.tx, sty: tf.current.ty };
      didDrag.current = false;
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const c = canvasRef.current!;
    if (drag.current) {
      didDrag.current = true;
      tf.current = {
        ...tf.current,
        tx: drag.current.stx + (e.clientX - drag.current.sx),
        ty: drag.current.sty + (e.clientY - drag.current.sy),
      };
      draw();
      return;
    }
    const rect = c.getBoundingClientRect();
    const { x, y } = worldPos(e.clientX - rect.left, e.clientY - rect.top);
    const coord = HexCoord.fromPixel(x, y, SIZE);
    const next = map.hasTile(coord) ? coord.key() : null;
    if (next !== hov.current) {
      hov.current = next;
      draw();
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || tool.id === ToolId.Pan) drag.current = null;
  };

  const onMouseLeave = () => { hov.current = null; draw(); };

  const onClick = (e: React.MouseEvent) => {
    if (didDrag.current) { didDrag.current = false; return; }
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const { x, y } = worldPos(e.clientX - rect.left, e.clientY - rect.top);
    const coord = HexCoord.fromPixel(x, y, SIZE);
    if (map.hasTile(coord)) {
      onTileClick(coord);
      onMutate(); // trigger redraw flow even if only selection changed
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: tool.id === ToolId.Pan ? 'grab' : 'crosshair' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onContextMenu={e => e.preventDefault()}
    />
  );
}
```

- [ ] **Step 4: Update `app/mapa/page.tsx`**

```tsx
import { MapEditor } from './MapEditor';

export const metadata = { title: 'Editor de Mapa — Civ VI' };

export default function MapPage() {
  return <MapEditor />;
}
```

- [ ] **Step 5: Manual verification + commit**

Run `npm run dev`. Open `http://localhost:3000/mapa`. Should see a 19-tile fog cluster (gray hexes) centered on screen. Hover highlights, scroll zooms toward cursor, middle-click drag pans. No new tiles appear yet on click.

```bash
git add app/mapa/
git commit -m "refactor(mapa): replace prototype with MapEditor + HexCanvas backed by GameMap"
```

---

### Task 10: Toolbar + keyboard shortcuts (1–0)

**Files:**
- Create: `app/mapa/shortcuts.ts`
- Create: `app/mapa/Toolbar.tsx`
- Modify: `app/mapa/MapEditor.tsx` (mount toolbar + key listener)

- [ ] **Step 1: Create `app/mapa/shortcuts.ts`**

```ts
import { Hand, MousePointer2, Cloud, Mountain, Trees, Gem, Building2, Star, Waves, Eraser } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ToolId } from '@/lib/civ/types';

export interface ToolDef {
  id: ToolId;
  label: string;
  hint: string;
  icon: LucideIcon;
  keyDigit: string; // '1'..'0'
}

export const TOOLS: ToolDef[] = [
  { id: ToolId.Select,   label: 'Selecionar',  hint: '1', icon: MousePointer2, keyDigit: '1' },
  { id: ToolId.Pan,      label: 'Mover',       hint: '2', icon: Hand,          keyDigit: '2' },
  { id: ToolId.Fog,      label: 'Névoa',       hint: '3', icon: Cloud,         keyDigit: '3' },
  { id: ToolId.Terrain,  label: 'Terreno',     hint: '4', icon: Mountain,      keyDigit: '4' },
  { id: ToolId.Feature,  label: 'Característica', hint: '5', icon: Trees,      keyDigit: '5' },
  { id: ToolId.Resource, label: 'Recurso',     hint: '6', icon: Gem,           keyDigit: '6' },
  { id: ToolId.District, label: 'Distrito',    hint: '7', icon: Building2,     keyDigit: '7' },
  { id: ToolId.Wonder,   label: 'Maravilha',   hint: '8', icon: Star,          keyDigit: '8' },
  { id: ToolId.River,    label: 'Rio',         hint: '9', icon: Waves,         keyDigit: '9' },
  { id: ToolId.Erase,    label: 'Apagar',      hint: '0', icon: Eraser,        keyDigit: '0' },
];

export function findToolByDigit(digit: string): ToolDef | undefined {
  return TOOLS.find(t => t.keyDigit === digit);
}
```

- [ ] **Step 2: Create `app/mapa/Toolbar.tsx`**

```tsx
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

/** Build the default ToolState for a given tool definition. */
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
```

- [ ] **Step 3: Modify `app/mapa/MapEditor.tsx`** — mount Toolbar and key listener.

Replace the file with:

```tsx
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { GameMap } from '@/lib/civ/GameMap';
import { HexCoord } from '@/lib/civ/HexCoord';
import { ToolId, Terrain, Feature, Resource, DistrictType, WonderType } from '@/lib/civ/types';
import { HexCanvas } from './HexCanvas';
import { Toolbar, defaultToolState } from './Toolbar';
import { findToolByDigit } from './shortcuts';

export type ToolState =
  | { id: ToolId.Select }
  | { id: ToolId.Pan }
  | { id: ToolId.Erase }
  | { id: ToolId.Fog }
  | { id: ToolId.Terrain;  payload: Terrain }
  | { id: ToolId.Feature;  payload: Feature }
  | { id: ToolId.Resource; payload: Resource }
  | { id: ToolId.District; payload: DistrictType }
  | { id: ToolId.Wonder;   payload: WonderType }
  | { id: ToolId.River };

export function MapEditor() {
  const mapRef = useRef<GameMap>(GameMap.initial());
  const [tool, setTool] = useState<ToolState>({ id: ToolId.Select });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion(v => v + 1), []);

  const handleTileClick = useCallback((coord: HexCoord) => {
    setSelectedKey(coord.key());
  }, []);

  // Keyboard shortcuts: 1..0 select tool, Ctrl+Z undo (wired in Task 12)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const def = findToolByDigit(e.key);
      if (def) {
        e.preventDefault();
        setTool(defaultToolState(def));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="w-screen h-screen bg-[var(--civ-blue-950)] relative overflow-hidden">
      <HexCanvas
        map={mapRef.current}
        version={version}
        selectedKey={selectedKey}
        tool={tool}
        onTileClick={handleTileClick}
        onMutate={bump}
      />
      <Toolbar tool={tool} onSelectTool={def => setTool(defaultToolState(def))} />
    </div>
  );
}
```

- [ ] **Step 4: Manual verification + commit**

Refresh `/mapa`. Toolbar should appear at top center with 10 buttons. Press 1–0; the active tool highlights gold. Hovering shows tooltip with shortcut.

```bash
git add app/mapa/Toolbar.tsx app/mapa/shortcuts.ts app/mapa/MapEditor.tsx
git commit -m "feat(mapa): top toolbar + keyboard shortcuts 1–0"
```

---

### Task 11: Tool actions through history (terrain/feature/resource/placement/erase)

**Files:**
- Modify: `app/mapa/HexCanvas.tsx` (route click → tool action)
- Modify: `app/mapa/MapEditor.tsx` (provide `applyTool` callback)

- [ ] **Step 1: Add `applyTool` callback in `MapEditor.tsx`**

Insert after `handleTileClick`:

```tsx
const applyTool = useCallback((coord: HexCoord) => {
  const map = mapRef.current;
  const tile = map.getTile(coord);
  if (!tile) return;

  switch (tool.id) {
    case ToolId.Select:
      setSelectedKey(coord.key());
      return;

    case ToolId.Pan:
      return;

    case ToolId.Terrain: {
      const { SetTerrainAction } = require('@/lib/civ/Action');
      map.perform(new SetTerrainAction(coord, tool.payload));
      break;
    }

    case ToolId.Feature: {
      const { SetFeatureAction } = require('@/lib/civ/Action');
      map.perform(new SetFeatureAction(coord, tool.payload));
      break;
    }

    case ToolId.Resource: {
      const { SetResourceAction } = require('@/lib/civ/Action');
      map.perform(new SetResourceAction(coord, tool.payload));
      break;
    }

    case ToolId.District: {
      const { SetPlacementAction } = require('@/lib/civ/Action');
      const { DistrictFactory } = require('@/lib/civ/District');
      map.perform(new SetPlacementAction(coord, DistrictFactory.create(tool.payload)));
      break;
    }

    case ToolId.Wonder: {
      const { SetPlacementAction } = require('@/lib/civ/Action');
      const { WonderFactory } = require('@/lib/civ/Wonder');
      map.perform(new SetPlacementAction(coord, WonderFactory.create(tool.payload)));
      break;
    }

    case ToolId.Erase: {
      const { SetPlacementAction } = require('@/lib/civ/Action');
      map.perform(new SetPlacementAction(coord, null));
      break;
    }

    case ToolId.Fog:
    case ToolId.River:
      // Handled in Task 12
      return;
  }

  bump();
}, [tool, bump]);
```

Replace the `require()` calls above with proper imports at the top of the file:

```tsx
import {
  SetTerrainAction, SetFeatureAction, SetResourceAction, SetPlacementAction,
} from '@/lib/civ/Action';
import { DistrictFactory } from '@/lib/civ/District';
import { WonderFactory } from '@/lib/civ/Wonder';
```

And rewrite `applyTool` switch cases without `require()`:

```tsx
case ToolId.Terrain:
  map.perform(new SetTerrainAction(coord, tool.payload));
  break;
case ToolId.Feature:
  map.perform(new SetFeatureAction(coord, tool.payload));
  break;
case ToolId.Resource:
  map.perform(new SetResourceAction(coord, tool.payload));
  break;
case ToolId.District:
  map.perform(new SetPlacementAction(coord, DistrictFactory.create(tool.payload)));
  break;
case ToolId.Wonder:
  map.perform(new SetPlacementAction(coord, WonderFactory.create(tool.payload)));
  break;
case ToolId.Erase:
  map.perform(new SetPlacementAction(coord, null));
  break;
```

Pass `onApplyTool={applyTool}` instead of `onTileClick={handleTileClick}` to `<HexCanvas>`. Remove `handleTileClick`.

- [ ] **Step 2: Update `HexCanvas.tsx`** — change prop name from `onTileClick` to `onApplyTool` and call it from `onClick`. Replace the `Props` interface and the `onClick` handler:

```tsx
interface Props {
  map: GameMap;
  version: number;
  selectedKey: string | null;
  tool: ToolState;
  onApplyTool: (coord: HexCoord) => void;
  onMutate: () => void;
}
```

```tsx
const onClick = (e: React.MouseEvent) => {
  if (didDrag.current) { didDrag.current = false; return; }
  const c = canvasRef.current!;
  const rect = c.getBoundingClientRect();
  const { x, y } = worldPos(e.clientX - rect.left, e.clientY - rect.top);
  const coord = HexCoord.fromPixel(x, y, SIZE);
  if (map.hasTile(coord)) {
    onApplyTool(coord);
  }
};
```

Remove the `onMutate()` call inside `onClick` (the parent now bumps after `applyTool`).

- [ ] **Step 3: Manual verification + commit**

Refresh `/mapa`. Press 4 (Terrain). Click a fog tile → it turns green (Grassland). Press 7 (District). Click another tile → "CC" appears (default is CityCenter). Press 8 (Wonder). Click → ★. Press 0 (Erase). Click → placement cleared.

```bash
git add app/mapa/MapEditor.tsx app/mapa/HexCanvas.tsx
git commit -m "feat(mapa): terrain/feature/resource/placement/erase wired through history"
```

---

### Task 12: Fog tool, river tool, and Ctrl+Z undo

**Files:**
- Modify: `app/mapa/MapEditor.tsx` (Fog tool + River tool + undo handler)

- [ ] **Step 1: Add `FogActivateAction` and a river toggle action to imports**

In `MapEditor.tsx` top:

```tsx
import {
  SetTerrainAction, SetFeatureAction, SetResourceAction, SetPlacementAction,
  FogActivateAction, CompositeAction,
} from '@/lib/civ/Action';
```

- [ ] **Step 2: Wire Fog tool case**

In the `applyTool` switch:

```tsx
case ToolId.Fog:
  if (tile.terrain === Terrain.Fog) {
    map.perform(new FogActivateAction(coord, Terrain.Grassland));
  }
  break;
```

- [ ] **Step 3: Wire River tool case** — toggle river on the edge nearest the click.

Before the switch, compute the clicked-edge-index by re-running `HexCoord.fromPixel` plus a sub-hex angle calc. Simplest approach: toggle ALL six edges' rivers as a stub. For now, restrict River to a stub that toggles `tile.edges[0].hasRiver` on a wrapped Action class.

Add inside `applyTool` (before the switch — only used by River):

```tsx
class ToggleEdgeRiverAction {
  description = 'Toggle rio (borda 0)';
  private prev?: boolean;
  constructor(readonly coord: HexCoord, readonly edgeIndex: number) {}
  apply(m: GameMap) {
    const t = m.getTile(this.coord); if (!t) return;
    this.prev = t.edges[this.edgeIndex].hasRiver;
    t.edges[this.edgeIndex].hasRiver = !this.prev;
  }
  revert(m: GameMap) {
    const t = m.getTile(this.coord); if (!t || this.prev === undefined) return;
    t.edges[this.edgeIndex].hasRiver = this.prev;
  }
}
```

Then add to switch:

```tsx
case ToolId.River:
  map.perform(new ToggleEdgeRiverAction(coord, 0));
  break;
```

(A polished river-edge picker is a future enhancement — out of scope for this plan.)

- [ ] **Step 4: Add Ctrl+Z handler**

Replace the existing keydown handler in `MapEditor.tsx` with:

```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      const undid = mapRef.current.undo();
      if (undid) bump();
      return;
    }

    const def = findToolByDigit(e.key);
    if (def) {
      e.preventDefault();
      setTool(defaultToolState(def));
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [bump]);
```

- [ ] **Step 5: Manual verification + commit**

Refresh `/mapa`. Press 3 (Fog). Click any edge fog tile → it activates (grassland) AND new fog hexes appear in radius 2 around it (the world grew). Press Ctrl+Z → fog returns and spawned tiles disappear. Press 9 (River). Click tile → no visible change yet (no edge renderer) but Ctrl+Z is reversible. Press 4 → click → press Ctrl+Z → terrain reverts.

```bash
git add app/mapa/MapEditor.tsx
git commit -m "feat(mapa): fog auto-expansion, river toggle stub, Ctrl+Z undo"
```

---

### Task 13: StatsPanel — selected tile yields

**Files:**
- Create: `app/mapa/StatsPanel.tsx`
- Modify: `app/mapa/MapEditor.tsx` (mount StatsPanel)

- [ ] **Step 1: Create `app/mapa/StatsPanel.tsx`**

```tsx
'use client';

import { GameMap } from '@/lib/civ/GameMap';
import { HexTile } from '@/lib/civ/HexTile';
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
        <Yield label="Comida"      value={stats.food} />
        <Yield label="Produção"    value={stats.production} />
        <Yield label="Ciência"     value={stats.science} />
        <Yield label="Ouro"        value={stats.gold} />
        <Yield label="Cultura"     value={stats.culture} />
        <Yield label="Fé"          value={stats.faith} />
        <Yield label="Moradia"     value={stats.housing}   isInt />
        <Yield label="Comodidade"  value={stats.amenities} isInt />
        <Yield label="Atratividade" value={stats.appeal}   isInt />
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
```

- [ ] **Step 2: Mount StatsPanel in `MapEditor.tsx`**

Add import:

```tsx
import { StatsPanel } from './StatsPanel';
```

Inside the JSX, after `<Toolbar … />`, add:

```tsx
<StatsPanel map={mapRef.current} selectedKey={selectedKey} />
```

Also: set `setSelectedKey(coord.key())` inside `applyTool` for the Select case, AND for any other tool, set `selectedKey` to the just-clicked coord so StatsPanel reflects the change. Update the switch:

```tsx
default:
  setSelectedKey(coord.key());
```

(Place this catch-all at the end after Erase. Or duplicate `setSelectedKey(coord.key())` in each case where mutation occurred.)

Cleaner: set `setSelectedKey` after the switch unconditionally:

```tsx
// after the switch + before bump():
if (tool.id !== ToolId.Pan) setSelectedKey(coord.key());
bump();
```

- [ ] **Step 3: Manual verification + commit**

Press 4 (Terrain) → click fog → terrain changes AND StatsPanel pops up bottom-left with food/prod values. Press 7 (District) → click → "CA" + Campus name + adjacency-derived science line in StatsPanel. Place a Mountain neighbor (terrain → Mountain) → Campus's science adjacency increases.

```bash
git add app/mapa/StatsPanel.tsx app/mapa/MapEditor.tsx
git commit -m "feat(mapa): StatsPanel — live tile yields with adjacency"
```

---

## Self-Review

**Spec coverage:**
- ✅ Dark mode + Excalidraw-style — top-floating Toolbar, dark canvas
- ✅ Pan + cursor-focused zoom — Task 9 wheel handler + space/middle-click drag
- ✅ Top navbar tools 1–0 + keyboard shortcuts — Task 10
- ✅ Fog auto-expansion radius 2 — `FogActivateAction` Task 7 + Fog tool Task 12
- ✅ Axial coords (q, r) — `HexCoord` Task 1
- ✅ Undo Ctrl+Z, max 25 — `HistoryManager.maxSteps = 25` Task 7 + handler Task 12
- ✅ Layered tile (terrain/feature/resource/placement) — `HexTile` Task 5
- ✅ `Stats` with floats + int housing/amenities/appeal — Task 1
- ✅ Adjacency engine — District subclasses Task 3
- ✅ Class diagram match:
  - `Map` → `GameMap` (renamed to avoid collision with native `Map`) — Task 6
  - `HexTile`, `HexEdge`, `Stats`, `Placement`, `District`, `Wonder`, `Requirement`,
    `PlayerContext`, `HistoryManager`, `Action` — all present
- ✅ District has `buildings: Building[]` + `getAdjacencyBonus` — Task 3
- ✅ HexTile has `edges: HexEdge[6]` + `hasFreshWater` + `getFinalStats` — Task 5

**Placeholder scan:** None. River tool is intentionally a stub on `edges[0]` (Task 12 Step 3) — flagged as out-of-scope future work, not a placeholder masquerading as done.

**Type consistency:**
- `Placement.getEffect(tile, map): Stats` — defined Task 2, used by HexTile.getFinalStats Task 5, implemented by every District + Wonder Tasks 3–4 ✅
- `Requirement.isSatisfiedBy(tile, map)` — Task 2; concrete classes only need `tile` and the second arg is optional in their bodies (TypeScript permits omitted parameters) ✅
- `GameMap.perform(action)` defined Task 8, used Tasks 11–12 ✅
- `Action.apply/revert(map)` defined Task 7, called by `HistoryManager` ✅
- `District.abbr` used in `HexCanvas` Task 9, defined in District base class Task 3 ✅
- `Wonder.color` and `District.color` used in `HexCanvas` ✅
- `ToolState` defined in `MapEditor.tsx` Task 9, imported by `Toolbar.tsx` Task 10 and `HexCanvas.tsx` Task 9 ✅
- `defaultToolState` returns full `ToolState` for all 10 ToolIds ✅

**Note on TDD:** This project has no test framework configured (per CLAUDE.md). The spec emphasizes correctness of Stats math and adjacency — adding Vitest is a reasonable follow-up plan, but in-scope verification here is manual via browser. The pure-domain layer (`lib/civ/`) is structured to make later unit testing straightforward (no React imports, no DOM dependencies).
