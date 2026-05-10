# Mapa Editor Civ VI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Civilization VI hex-map editor at `/mapa` where users can paint terrain, place districts/wonders, and configure each tile — like Excalidraw but for Civ VI.

**Architecture:** HTML5 Canvas renders the hex grid (fast for 100+ tiles). React manages UI overlays (toolbars, config panel). OOP TypeScript classes in `lib/map/` model the domain (District hierarchy, Wonder, Tile, HexMap). State lives in MapEditor as React state; canvas redraws via `useEffect`. Axial hex coordinates (q, r) with pointy-top hexagons.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, HTML5 Canvas API, `lucide-react`. No new npm packages needed.

---

## File Structure

```
lib/map/
  HexCoord.ts          — Axial coord math: toPixel, fromPixel, neighbors, round
  types.ts             — All enums: TerrainType, FeatureType, ResourceType,
                         DistrictType, BuildingType, WonderType, ImprovementType
  District.ts          — Abstract District + 15 concrete subclasses + DistrictFactory
  Wonder.ts            — Wonder class + WONDER_META lookup
  Tile.ts              — Tile class: coord + terrain + feature + resource + district + wonder
  HexMap.ts            — HexMap: Map<key, Tile>, CRUD, createInitialMap()

app/mapa/
  page.tsx             — Route entry ("use client" shell, renders MapEditor)
  MapEditor.tsx        — State owner: hexMap, selectedTile, activeTool, transform
  HexCanvas.tsx        — <canvas> element: draws all tiles, hover, selection
  ToolSidebar.tsx      — Left panel: tool mode buttons + sub-picker (terrain/district/wonder)
  TileConfigPanel.tsx  — Right panel: shows selected tile details, toggles buildings
```

---

### Task 1: HexCoord + types enums

**Files:**
- Create: `lib/map/HexCoord.ts`
- Create: `lib/map/types.ts`

- [ ] **Step 1: Create `lib/map/HexCoord.ts`**

```typescript
export class HexCoord {
  constructor(readonly q: number, readonly r: number) {}

  get s(): number { return -this.q - this.r; }

  key(): string { return `${this.q},${this.r}`; }

  static fromKey(key: string): HexCoord {
    const [q, r] = key.split(',').map(Number);
    return new HexCoord(q, r);
  }

  toPixel(size: number): { x: number; y: number } {
    return {
      x: size * (Math.sqrt(3) * this.q + (Math.sqrt(3) / 2) * this.r),
      y: size * (1.5 * this.r),
    };
  }

  static fromPixel(x: number, y: number, size: number): HexCoord {
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
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
    return NEIGHBOR_DIRS.map(([dq, dr]) => new HexCoord(this.q + dq, this.r + dr));
  }

  equals(other: HexCoord): boolean {
    return this.q === other.q && this.r === other.r;
  }
}

const NEIGHBOR_DIRS: [number, number][] = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

export function hexCorners(cx: number, cy: number, size: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
  });
}
```

- [ ] **Step 2: Create `lib/map/types.ts`**

```typescript
export enum TerrainType {
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

export enum FeatureType {
  None = 'none',
  Forest = 'forest',
  Rainforest = 'rainforest',
  Marsh = 'marsh',
  Floodplains = 'floodplains',
  Oasis = 'oasis',
  Ice = 'ice',
  Reef = 'reef',
  Volcano = 'volcano',
}

export enum ResourceType {
  None = 'none',
  // Bonus
  Bananas = 'bananas', Cattle = 'cattle', Copper = 'copper', Crabs = 'crabs',
  Deer = 'deer', Fish = 'fish', Rice = 'rice', Sheep = 'sheep',
  Stone = 'stone', Wheat = 'wheat',
  // Luxury
  Amber = 'amber', Citrus = 'citrus', Cotton = 'cotton', Diamonds = 'diamonds',
  Dyes = 'dyes', Furs = 'furs', Ivory = 'ivory', Jade = 'jade',
  Mercury = 'mercury', Pearls = 'pearls', Salt = 'salt', Silk = 'silk',
  Silver = 'silver', Spices = 'spices', Sugar = 'sugar', Tea = 'tea',
  Tobacco = 'tobacco', Truffles = 'truffles', Whales = 'whales', Wine = 'wine',
  // Strategic
  Aluminum = 'aluminum', Coal = 'coal', Horses = 'horses', Iron = 'iron',
  Niter = 'niter', Oil = 'oil', Uranium = 'uranium',
}

export enum DistrictType {
  CityCenter = 'city_center',
  Campus = 'campus',
  CommercialHub = 'commercial_hub',
  Encampment = 'encampment',
  EntertainmentComplex = 'entertainment_complex',
  Harbor = 'harbor',
  HolySite = 'holy_site',
  IndustrialZone = 'industrial_zone',
  TheaterSquare = 'theater_square',
  Aqueduct = 'aqueduct',
  Dam = 'dam',
  Neighborhood = 'neighborhood',
  Spaceport = 'spaceport',
  Aerodrome = 'aerodrome',
  GovernmentPlaza = 'government_plaza',
}

export enum BuildingType {
  // Campus
  Library = 'library', University = 'university', ResearchLab = 'research_lab',
  // Commercial Hub
  Market = 'market', Bank = 'bank', StockExchange = 'stock_exchange',
  // Encampment
  Barracks = 'barracks', Armory = 'armory', MilitaryAcademy = 'military_academy',
  // Entertainment Complex
  Arena = 'arena', Zoo = 'zoo', Stadium = 'stadium',
  // Harbor
  Lighthouse = 'lighthouse', Shipyard = 'shipyard', Seaport = 'seaport',
  // Holy Site
  Shrine = 'shrine', Temple = 'temple',
  // Industrial Zone
  Workshop = 'workshop', Factory = 'factory', PowerPlant = 'power_plant',
  // Theater Square
  Amphitheater = 'amphitheater', ArtMuseum = 'art_museum', ArchaeologicalMuseum = 'archaeological_museum',
  // City Center
  Monument = 'monument', Granary = 'granary', WaterMill = 'water_mill',
  AncientWalls = 'ancient_walls', MedievalWalls = 'medieval_walls', RenaissanceWalls = 'renaissance_walls',
  Palace = 'palace',
}

export enum WonderType {
  Pyramids = 'pyramids',
  GreatWall = 'great_wall',
  Stonehenge = 'stonehenge',
  GreatLibrary = 'great_library',
  Colosseum = 'colosseum',
  BigBen = 'big_ben',
  EiffelTower = 'eiffel_tower',
  Colossus = 'colossus',
  Oracle = 'oracle',
  TempleOfArtemis = 'temple_of_artemis',
  StatueOfLiberty = 'statue_of_liberty',
  MachuPicchu = 'machu_picchu',
  PotalaPalace = 'potala_palace',
  RuhrValley = 'ruhr_valley',
  SydneyOperaHouse = 'sydney_opera_house',
  HagiaSophia = 'hagia_sophia',
  Alhambra = 'alhambra',
  VenetianArsenal = 'venetian_arsenal',
  HangingGardens = 'hanging_gardens',
  LighthouseOfAlexandria = 'lighthouse_of_alexandria',
  ChichenItza = 'chichen_itza',
  Petra = 'petra',
  TajMahal = 'taj_mahal',
  ForbiddenCity = 'forbidden_city',
  PalaceOfVersailles = 'palace_of_versailles',
  OxfordUniversity = 'oxford_university',
  BolshoiTheater = 'bolshoi_theater',
  CristoRedentor = 'cristo_redentor',
  Etemenanki = 'etemenanki',
  Hermitage = 'hermitage',
  KilwaKisiwani = 'kilwa_kisiwani',
  MausolaeumAtHalicarnassus = 'mausolaeum_at_halicarnassus',
  StatueOfZeus = 'statue_of_zeus',
}

export type ImprovementType =
  | 'none' | 'farm' | 'mine' | 'quarry' | 'camp' | 'pasture'
  | 'fishing_boats' | 'lumber_mill' | 'plantation' | 'oil_well'
  | 'offshore_oil_rig' | 'airstrip' | 'fort' | 'trading_post';

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  [TerrainType.Ocean]:          'Oceano',
  [TerrainType.Coast]:          'Costa',
  [TerrainType.Grassland]:      'Planície Verde',
  [TerrainType.GrasslandHills]: 'Colinas Verdes',
  [TerrainType.Plains]:         'Planície',
  [TerrainType.PlainsHills]:    'Colinas',
  [TerrainType.Desert]:         'Deserto',
  [TerrainType.DesertHills]:    'Colinas Desérticas',
  [TerrainType.Tundra]:         'Tundra',
  [TerrainType.TundraHills]:    'Colinas Tundra',
  [TerrainType.Snow]:           'Neve',
  [TerrainType.SnowHills]:      'Colinas Nevadas',
  [TerrainType.Mountain]:       'Montanha',
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.Ocean]:          '#1a3a5c',
  [TerrainType.Coast]:          '#2d6a9f',
  [TerrainType.Grassland]:      '#4a7c3f',
  [TerrainType.GrasslandHills]: '#3d6834',
  [TerrainType.Plains]:         '#c8a850',
  [TerrainType.PlainsHills]:    '#b09040',
  [TerrainType.Desert]:         '#d4b483',
  [TerrainType.DesertHills]:    '#c0a070',
  [TerrainType.Tundra]:         '#8fa8a0',
  [TerrainType.TundraHills]:    '#7a9390',
  [TerrainType.Snow]:           '#dde8ee',
  [TerrainType.SnowHills]:      '#c8d8e0',
  [TerrainType.Mountain]:       '#6b5a4e',
};

export const FEATURE_LABELS: Record<FeatureType, string> = {
  [FeatureType.None]:        'Nenhum',
  [FeatureType.Forest]:      'Floresta',
  [FeatureType.Rainforest]:  'Floresta Tropical',
  [FeatureType.Marsh]:       'Pântano',
  [FeatureType.Floodplains]: 'Planície Aluvial',
  [FeatureType.Oasis]:       'Oásis',
  [FeatureType.Ice]:         'Gelo',
  [FeatureType.Reef]:        'Recife',
  [FeatureType.Volcano]:     'Vulcão',
};

export const BUILDING_LABELS: Record<BuildingType, string> = {
  [BuildingType.Library]:               'Biblioteca',
  [BuildingType.University]:            'Universidade',
  [BuildingType.ResearchLab]:           'Laboratório de Pesquisa',
  [BuildingType.Market]:                'Mercado',
  [BuildingType.Bank]:                  'Banco',
  [BuildingType.StockExchange]:         'Bolsa de Valores',
  [BuildingType.Barracks]:              'Quartel',
  [BuildingType.Armory]:                'Armaria',
  [BuildingType.MilitaryAcademy]:       'Academia Militar',
  [BuildingType.Arena]:                 'Arena',
  [BuildingType.Zoo]:                   'Zoológico',
  [BuildingType.Stadium]:               'Estádio',
  [BuildingType.Lighthouse]:            'Farol',
  [BuildingType.Shipyard]:              'Estaleiro',
  [BuildingType.Seaport]:               'Porto',
  [BuildingType.Shrine]:                'Santuário',
  [BuildingType.Temple]:                'Templo',
  [BuildingType.Workshop]:              'Oficina',
  [BuildingType.Factory]:               'Fábrica',
  [BuildingType.PowerPlant]:            'Usina de Energia',
  [BuildingType.Amphitheater]:          'Anfiteatro',
  [BuildingType.ArtMuseum]:             'Museu de Arte',
  [BuildingType.ArchaeologicalMuseum]:  'Museu Arqueológico',
  [BuildingType.Monument]:              'Monumento',
  [BuildingType.Granary]:               'Celeiro',
  [BuildingType.WaterMill]:             'Moinho de Água',
  [BuildingType.AncientWalls]:          'Muralhas Antigas',
  [BuildingType.MedievalWalls]:         'Muralhas Medievais',
  [BuildingType.RenaissanceWalls]:      'Muralhas Renascentistas',
  [BuildingType.Palace]:                'Palácio',
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `lib/map/HexCoord.ts` or `lib/map/types.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/map/HexCoord.ts lib/map/types.ts
git commit -m "feat(mapa): hex coord math + all Civ VI type enums"
```

---

### Task 2: District OOP — abstract class + 15 subclasses + factory

**Files:**
- Create: `lib/map/District.ts`

- [ ] **Step 1: Create `lib/map/District.ts`**

```typescript
import { BuildingType as B, DistrictType as D, BUILDING_LABELS } from './types';

export interface DistrictMeta {
  type: D;
  label: string;
  color: string;
  abbreviation: string;
  availableBuildings: B[];
}

export abstract class District {
  buildings: Set<B> = new Set();

  abstract get meta(): DistrictMeta;

  get type(): D { return this.meta.type; }
  get label(): string { return this.meta.label; }
  get color(): string { return this.meta.color; }
  get abbreviation(): string { return this.meta.abbreviation; }

  addBuilding(b: B): void {
    if (this.meta.availableBuildings.includes(b)) this.buildings.add(b);
  }

  removeBuilding(b: B): void { this.buildings.delete(b); }

  hasBuilding(b: B): boolean { return this.buildings.has(b); }

  buildingLabel(b: B): string { return BUILDING_LABELS[b]; }

  serialize(): { type: D; buildings: B[] } {
    return { type: this.type, buildings: [...this.buildings] };
  }

  static deserialize(data: { type: D; buildings: B[] }): District {
    const d = DistrictFactory.create(data.type);
    data.buildings.forEach(b => d.addBuilding(b));
    return d;
  }
}

export class CityCenter extends District {
  get meta(): DistrictMeta {
    return {
      type: D.CityCenter, label: 'Centro da Cidade', color: '#c0392b', abbreviation: 'CC',
      availableBuildings: [B.Monument, B.Granary, B.WaterMill, B.AncientWalls, B.MedievalWalls, B.RenaissanceWalls, B.Palace],
    };
  }
}

export class Campus extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Campus, label: 'Campus', color: '#2980b9', abbreviation: 'CA',
      availableBuildings: [B.Library, B.University, B.ResearchLab],
    };
  }
}

export class CommercialHub extends District {
  get meta(): DistrictMeta {
    return {
      type: D.CommercialHub, label: 'Hub Comercial', color: '#f39c12', abbreviation: 'HC',
      availableBuildings: [B.Market, B.Bank, B.StockExchange],
    };
  }
}

export class Encampment extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Encampment, label: 'Acampamento', color: '#7f8c8d', abbreviation: 'AC',
      availableBuildings: [B.Barracks, B.Armory, B.MilitaryAcademy],
    };
  }
}

export class EntertainmentComplex extends District {
  get meta(): DistrictMeta {
    return {
      type: D.EntertainmentComplex, label: 'Complexo de Entretenimento', color: '#9b59b6', abbreviation: 'CE',
      availableBuildings: [B.Arena, B.Zoo, B.Stadium],
    };
  }
}

export class Harbor extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Harbor, label: 'Porto', color: '#1a8fad', abbreviation: 'PO',
      availableBuildings: [B.Lighthouse, B.Shipyard, B.Seaport],
    };
  }
}

export class HolySite extends District {
  get meta(): DistrictMeta {
    return {
      type: D.HolySite, label: 'Local Sagrado', color: '#e8d44d', abbreviation: 'LS',
      availableBuildings: [B.Shrine, B.Temple],
    };
  }
}

export class IndustrialZone extends District {
  get meta(): DistrictMeta {
    return {
      type: D.IndustrialZone, label: 'Zona Industrial', color: '#e67e22', abbreviation: 'ZI',
      availableBuildings: [B.Workshop, B.Factory, B.PowerPlant],
    };
  }
}

export class TheaterSquare extends District {
  get meta(): DistrictMeta {
    return {
      type: D.TheaterSquare, label: 'Praça do Teatro', color: '#8e44ad', abbreviation: 'PT',
      availableBuildings: [B.Amphitheater, B.ArtMuseum, B.ArchaeologicalMuseum],
    };
  }
}

export class Aqueduct extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Aqueduct, label: 'Aqueduto', color: '#27ae60', abbreviation: 'AQ',
      availableBuildings: [],
    };
  }
}

export class Dam extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Dam, label: 'Represa', color: '#2ecc71', abbreviation: 'RE',
      availableBuildings: [],
    };
  }
}

export class Neighborhood extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Neighborhood, label: 'Bairro', color: '#795548', abbreviation: 'BA',
      availableBuildings: [],
    };
  }
}

export class Spaceport extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Spaceport, label: 'Cosmódromo', color: '#546e7a', abbreviation: 'CS',
      availableBuildings: [],
    };
  }
}

export class Aerodrome extends District {
  get meta(): DistrictMeta {
    return {
      type: D.Aerodrome, label: 'Aeródromo', color: '#607d8b', abbreviation: 'AE',
      availableBuildings: [],
    };
  }
}

export class GovernmentPlaza extends District {
  get meta(): DistrictMeta {
    return {
      type: D.GovernmentPlaza, label: 'Praça do Governo', color: '#b7950b', abbreviation: 'PG',
      availableBuildings: [],
    };
  }
}

export class DistrictFactory {
  static create(type: D): District {
    switch (type) {
      case D.CityCenter:           return new CityCenter();
      case D.Campus:               return new Campus();
      case D.CommercialHub:        return new CommercialHub();
      case D.Encampment:           return new Encampment();
      case D.EntertainmentComplex: return new EntertainmentComplex();
      case D.Harbor:               return new Harbor();
      case D.HolySite:             return new HolySite();
      case D.IndustrialZone:       return new IndustrialZone();
      case D.TheaterSquare:        return new TheaterSquare();
      case D.Aqueduct:             return new Aqueduct();
      case D.Dam:                  return new Dam();
      case D.Neighborhood:         return new Neighborhood();
      case D.Spaceport:            return new Spaceport();
      case D.Aerodrome:            return new Aerodrome();
      case D.GovernmentPlaza:      return new GovernmentPlaza();
    }
  }

  static allMeta(): DistrictMeta[] {
    return Object.values(D).map(t => DistrictFactory.create(t as D).meta);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/map/District.ts
git commit -m "feat(mapa): District abstract class + 15 subclasses + DistrictFactory"
```

---

### Task 3: Wonder, Tile, HexMap

**Files:**
- Create: `lib/map/Wonder.ts`
- Create: `lib/map/Tile.ts`
- Create: `lib/map/HexMap.ts`

- [ ] **Step 1: Create `lib/map/Wonder.ts`**

```typescript
import { WonderType } from './types';

export interface WonderMeta {
  type: WonderType;
  label: string;
  era: string;
  color: string;
}

const W = WonderType;

export const WONDER_META: Record<WonderType, WonderMeta> = {
  [W.Pyramids]:                   { type: W.Pyramids, label: 'Pirâmides', era: 'Antiga', color: '#c8a031' },
  [W.GreatWall]:                  { type: W.GreatWall, label: 'Grande Muralha', era: 'Antiga', color: '#8d7b68' },
  [W.Stonehenge]:                 { type: W.Stonehenge, label: 'Stonehenge', era: 'Antiga', color: '#9e9e9e' },
  [W.GreatLibrary]:               { type: W.GreatLibrary, label: 'Grande Biblioteca', era: 'Clássica', color: '#f5e642' },
  [W.Colosseum]:                  { type: W.Colosseum, label: 'Coliseu', era: 'Clássica', color: '#e0c060' },
  [W.BigBen]:                     { type: W.BigBen, label: 'Big Ben', era: 'Industrial', color: '#a0a0a0' },
  [W.EiffelTower]:                { type: W.EiffelTower, label: 'Torre Eiffel', era: 'Moderna', color: '#b0b0b0' },
  [W.Colossus]:                   { type: W.Colossus, label: 'Colosso', era: 'Antiga', color: '#d4af37' },
  [W.Oracle]:                     { type: W.Oracle, label: 'Oráculo', era: 'Clássica', color: '#a8c8e8' },
  [W.TempleOfArtemis]:            { type: W.TempleOfArtemis, label: 'Templo de Ártemis', era: 'Antiga', color: '#e8d5b0' },
  [W.StatueOfLiberty]:            { type: W.StatueOfLiberty, label: 'Estátua da Liberdade', era: 'Industrial', color: '#78a878' },
  [W.MachuPicchu]:                { type: W.MachuPicchu, label: 'Machu Picchu', era: 'Medieval', color: '#8fbc8f' },
  [W.PotalaPalace]:               { type: W.PotalaPalace, label: 'Palácio Potala', era: 'Medieval', color: '#e0e8f0' },
  [W.RuhrValley]:                 { type: W.RuhrValley, label: 'Vale do Ruhr', era: 'Industrial', color: '#607d8b' },
  [W.SydneyOperaHouse]:           { type: W.SydneyOperaHouse, label: 'Ópera de Sydney', era: 'Atômica', color: '#e0f0ff' },
  [W.HagiaSophia]:                { type: W.HagiaSophia, label: 'Hagia Sophia', era: 'Medieval', color: '#e8c89a' },
  [W.Alhambra]:                   { type: W.Alhambra, label: 'Alhambra', era: 'Medieval', color: '#c08850' },
  [W.VenetianArsenal]:            { type: W.VenetianArsenal, label: 'Arsenal Veneziano', era: 'Renascença', color: '#d4a017' },
  [W.HangingGardens]:             { type: W.HangingGardens, label: 'Jardins Suspensos', era: 'Antiga', color: '#66bb6a' },
  [W.LighthouseOfAlexandria]:     { type: W.LighthouseOfAlexandria, label: 'Farol de Alexandria', era: 'Antiga', color: '#f5f5dc' },
  [W.ChichenItza]:                { type: W.ChichenItza, label: 'Chichén Itzá', era: 'Medieval', color: '#c8a850' },
  [W.Petra]:                      { type: W.Petra, label: 'Petra', era: 'Clássica', color: '#e8b070' },
  [W.TajMahal]:                   { type: W.TajMahal, label: 'Taj Mahal', era: 'Renascença', color: '#f8f8f8' },
  [W.ForbiddenCity]:              { type: W.ForbiddenCity, label: 'Cidade Proibida', era: 'Renascença', color: '#8b0000' },
  [W.PalaceOfVersailles]:         { type: W.PalaceOfVersailles, label: 'Palácio de Versalhes', era: 'Renascença', color: '#ffd700' },
  [W.OxfordUniversity]:           { type: W.OxfordUniversity, label: 'Universidade de Oxford', era: 'Industrial', color: '#1a237e' },
  [W.BolshoiTheater]:             { type: W.BolshoiTheater, label: 'Teatro Bolshoi', era: 'Industrial', color: '#b71c1c' },
  [W.CristoRedentor]:             { type: W.CristoRedentor, label: 'Cristo Redentor', era: 'Moderna', color: '#e0e0e0' },
  [W.Etemenanki]:                 { type: W.Etemenanki, label: 'Etemenanki', era: 'Antiga', color: '#795548' },
  [W.Hermitage]:                  { type: W.Hermitage, label: 'Hermitage', era: 'Industrial', color: '#311b92' },
  [W.KilwaKisiwani]:              { type: W.KilwaKisiwani, label: 'Kilwa Kisiwani', era: 'Medieval', color: '#d4a073' },
  [W.MausolaeumAtHalicarnassus]:  { type: W.MausolaeumAtHalicarnassus, label: 'Mausoléu de Halicarnasso', era: 'Clássica', color: '#d2b48c' },
  [W.StatueOfZeus]:               { type: W.StatueOfZeus, label: 'Estátua de Zeus', era: 'Clássica', color: '#ffd700' },
};

export class Wonder {
  constructor(readonly type: WonderType) {}

  get meta(): WonderMeta { return WONDER_META[this.type]; }
  get label(): string { return this.meta.label; }
  get era(): string { return this.meta.era; }
  get color(): string { return this.meta.color; }

  serialize(): { type: WonderType } { return { type: this.type }; }

  static deserialize(data: { type: WonderType }): Wonder {
    return new Wonder(data.type);
  }
}
```

- [ ] **Step 2: Create `lib/map/Tile.ts`**

```typescript
import { HexCoord } from './HexCoord';
import { TerrainType, FeatureType, ResourceType, ImprovementType } from './types';
import { District } from './District';
import { Wonder } from './Wonder';

export class Tile {
  constructor(
    readonly coord: HexCoord,
    public terrain: TerrainType = TerrainType.Grassland,
    public feature: FeatureType = FeatureType.None,
    public resource: ResourceType = ResourceType.None,
    public improvement: ImprovementType = 'none',
    public district: District | null = null,
    public wonder: Wonder | null = null,
  ) {}

  setDistrict(d: District | null): void {
    if (d !== null) this.wonder = null; // district and wonder exclusive
    this.district = d;
  }

  setWonder(w: Wonder | null): void {
    if (w !== null) this.district = null; // wonder and district exclusive
    this.wonder = w;
  }

  clone(): Tile {
    return new Tile(
      this.coord,
      this.terrain,
      this.feature,
      this.resource,
      this.improvement,
      this.district,
      this.wonder,
    );
  }
}
```

- [ ] **Step 3: Create `lib/map/HexMap.ts`**

```typescript
import { HexCoord } from './HexCoord';
import { TerrainType } from './types';
import { Tile } from './Tile';

export class HexMap {
  private tiles: Map<string, Tile> = new Map();

  setTile(coord: HexCoord, tile: Tile): void {
    this.tiles.set(coord.key(), tile);
  }

  getTile(coord: HexCoord): Tile | undefined {
    return this.tiles.get(coord.key());
  }

  deleteTile(coord: HexCoord): void {
    this.tiles.delete(coord.key());
  }

  hasTile(coord: HexCoord): boolean {
    return this.tiles.has(coord.key());
  }

  allTiles(): Tile[] {
    return [...this.tiles.values()];
  }

  neighbors(coord: HexCoord): Tile[] {
    return coord.neighbors()
      .map(n => this.getTile(n))
      .filter((t): t is Tile => t !== undefined);
  }

  size(): number { return this.tiles.size; }
}

export function createInitialMap(radius: number = 5): HexMap {
  const map = new HexMap();
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) {
      const coord = new HexCoord(q, r);
      map.setTile(coord, new Tile(coord, TerrainType.Grassland));
    }
  }
  return map;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/map/Wonder.ts lib/map/Tile.ts lib/map/HexMap.ts
git commit -m "feat(mapa): Wonder, Tile, HexMap domain classes"
```

---

### Task 4: Canvas renderer + route scaffold

**Files:**
- Create: `app/mapa/page.tsx`
- Create: `app/mapa/MapEditor.tsx`
- Create: `app/mapa/HexCanvas.tsx`

- [ ] **Step 1: Create `app/mapa/page.tsx`**

```tsx
import { MapEditor } from './MapEditor';

export const metadata = { title: 'Editor de Mapa — Civ VI' };

export default function MapPage() {
  return <MapEditor />;
}
```

- [ ] **Step 2: Create `app/mapa/MapEditor.tsx`**

```tsx
'use client';

import { useState, useCallback } from 'react';
import { HexCanvas } from './HexCanvas';
import { ToolSidebar } from './ToolSidebar';
import { TileConfigPanel } from './TileConfigPanel';
import { HexMap, createInitialMap } from '@/lib/map/HexMap';
import { HexCoord } from '@/lib/map/HexCoord';
import { Tile } from '@/lib/map/Tile';
import type { TerrainType, DistrictType, WonderType } from '@/lib/map/types';
import { DistrictFactory } from '@/lib/map/District';
import { Wonder } from '@/lib/map/Wonder';

export type ToolMode =
  | { mode: 'select' }
  | { mode: 'terrain'; terrain: TerrainType }
  | { mode: 'district'; districtType: DistrictType }
  | { mode: 'wonder'; wonderType: WonderType }
  | { mode: 'erase' };

export type Transform = { scale: number; tx: number; ty: number };

export function MapEditor() {
  const [hexMap, setHexMap] = useState<HexMap>(() => createInitialMap(5));
  const [selectedCoord, setSelectedCoord] = useState<HexCoord | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>({ mode: 'select' });
  const [transform, setTransform] = useState<Transform>({ scale: 1, tx: 0, ty: 0 });
  const [tick, setTick] = useState(0); // force canvas redraw

  const forceRedraw = useCallback(() => setTick(t => t + 1), []);

  const selectedTile = selectedCoord ? hexMap.getTile(selectedCoord) ?? null : null;

  const applyTool = useCallback((coord: HexCoord) => {
    const tile = hexMap.getTile(coord);
    if (!tile) return;

    if (activeTool.mode === 'select') {
      setSelectedCoord(coord);
      return;
    }

    if (activeTool.mode === 'terrain') {
      tile.terrain = activeTool.terrain;
    } else if (activeTool.mode === 'district') {
      tile.setDistrict(DistrictFactory.create(activeTool.districtType));
    } else if (activeTool.mode === 'wonder') {
      tile.setWonder(new Wonder(activeTool.wonderType));
    } else if (activeTool.mode === 'erase') {
      tile.district = null;
      tile.wonder = null;
    }

    setHexMap(hexMap); // same ref, but tick forces redraw
    forceRedraw();
  }, [hexMap, activeTool, forceRedraw]);

  const updateTile = useCallback((updatedTile: Tile) => {
    hexMap.setTile(updatedTile.coord, updatedTile);
    setHexMap(hexMap);
    forceRedraw();
  }, [hexMap, forceRedraw]);

  return (
    <div className="flex h-screen bg-[var(--civ-blue-950)] text-[var(--civ-gold-100)] overflow-hidden">
      <ToolSidebar activeTool={activeTool} onToolChange={setActiveTool} />
      <div className="flex-1 relative">
        <HexCanvas
          hexMap={hexMap}
          tick={tick}
          transform={transform}
          onTransformChange={setTransform}
          selectedCoord={selectedCoord}
          onTileClick={applyTool}
        />
      </div>
      <TileConfigPanel tile={selectedTile} onTileChange={updateTile} />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/mapa/HexCanvas.tsx`** (renders all tiles, no interaction yet)

```tsx
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { HexMap } from '@/lib/map/HexMap';
import { HexCoord, hexCorners } from '@/lib/map/HexCoord';
import { TERRAIN_COLORS } from '@/lib/map/types';
import type { Transform } from './MapEditor';

const HEX_SIZE = 36;

interface Props {
  hexMap: HexMap;
  tick: number;
  transform: Transform;
  onTransformChange: (t: Transform) => void;
  selectedCoord: HexCoord | null;
  onTileClick: (coord: HexCoord) => void;
}

export function HexCanvas({ hexMap, tick, transform, onTransformChange, selectedCoord, onTileClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<HexCoord | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.tx, transform.ty);

    for (const tile of hexMap.allTiles()) {
      const { x, y } = tile.coord.toPixel(HEX_SIZE);
      const corners = hexCorners(x, y, HEX_SIZE - 1);
      const isSelected = selectedCoord?.equals(tile.coord) ?? false;
      const isHovered = hoverRef.current?.equals(tile.coord) ?? false;

      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
      ctx.closePath();

      ctx.fillStyle = TERRAIN_COLORS[tile.terrain];
      ctx.fill();

      if (isSelected) {
        ctx.fillStyle = 'rgba(218,183,103,0.35)';
        ctx.fill();
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
      }

      ctx.strokeStyle = isSelected ? '#dab767' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // District label
      if (tile.district) {
        ctx.fillStyle = tile.district.color;
        ctx.font = `bold ${HEX_SIZE * 0.38}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.district.abbreviation, x, y);
      }

      // Wonder star
      if (tile.wonder) {
        ctx.fillStyle = tile.wonder.color;
        ctx.font = `${HEX_SIZE * 0.36}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x, tile.district ? y + HEX_SIZE * 0.3 : y);
      }
    }

    ctx.restore();
  }, [hexMap, tick, transform, selectedCoord]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }, [draw]);

  const canvasToWorld = (cx: number, cy: number) => ({
    x: (cx - transform.tx) / transform.scale,
    y: (cy - transform.ty) / transform.scale,
  });

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const coord = HexCoord.fromPixel(x, y, HEX_SIZE);
    if (hexMap.hasTile(coord)) onTileClick(coord);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const coord = HexCoord.fromPixel(x, y, HEX_SIZE);
    hoverRef.current = hexMap.hasTile(coord) ? coord : null;
    draw();
  };

  const handleMouseLeave = () => {
    hoverRef.current = null;
    draw();
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
```

- [ ] **Step 4: Create stub `app/mapa/ToolSidebar.tsx`** (empty panels — replaced in Task 7)

```tsx
'use client';

import type { ToolMode } from './MapEditor';

interface Props {
  activeTool: ToolMode;
  onToolChange: (t: ToolMode) => void;
}

export function ToolSidebar({ activeTool, onToolChange }: Props) {
  return (
    <div className="w-14 bg-[var(--civ-panel)] border-r border-[var(--civ-gold-500)]/20 flex flex-col items-center py-3 gap-2 text-xs">
      <span className="text-[var(--civ-gold-300)]">◎</span>
    </div>
  );
}
```

- [ ] **Step 5: Create stub `app/mapa/TileConfigPanel.tsx`**

```tsx
'use client';

import { Tile } from '@/lib/map/Tile';

interface Props {
  tile: Tile | null;
  onTileChange: (tile: Tile) => void;
}

export function TileConfigPanel({ tile }: Props) {
  return (
    <div className="w-64 bg-[var(--civ-panel)] border-l border-[var(--civ-gold-500)]/20 p-4">
      {tile ? (
        <p className="text-sm text-[var(--civ-gold-200)]">
          Tile ({tile.coord.q}, {tile.coord.r})
        </p>
      ) : (
        <p className="text-xs text-[var(--civ-gold-300)]/60">Nenhum tile selecionado</p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run dev server and verify hex grid renders**

```bash
npm run dev
```

Open `http://localhost:3000/mapa`. Should see a blue-dark background with a hex grid of green hexagons. Hovering should highlight tiles. Clicking should show coordinates in right panel.

- [ ] **Step 7: Commit**

```bash
git add app/mapa/
git commit -m "feat(mapa): canvas hex grid renders, click selects tile"
```

---

### Task 5: Zoom + Pan

**Files:**
- Modify: `app/mapa/HexCanvas.tsx` (add wheel + drag handlers)
- Modify: `app/mapa/MapEditor.tsx` (center initial transform on canvas)

- [ ] **Step 1: Add initial centering transform in MapEditor**

In `MapEditor.tsx`, replace the `useState` for transform with:

```tsx
const [transform, setTransform] = useState<Transform>({ scale: 1, tx: 400, ty: 300 });
```

(These pixel values center the hex grid; adjust based on canvas size.)

- [ ] **Step 2: Add wheel handler for zoom in HexCanvas**

Add to `HexCanvas.tsx` inside the component (before return):

```tsx
const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
  e.preventDefault();
  const rect = canvasRef.current!.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.max(0.3, Math.min(4, transform.scale * factor));
  // Zoom toward cursor
  const tx = cx - (cx - transform.tx) * (newScale / transform.scale);
  const ty = cy - (cy - transform.ty) * (newScale / transform.scale);
  onTransformChange({ scale: newScale, tx, ty });
};
```

Add `onWheel={handleWheel}` to the `<canvas>` element.

- [ ] **Step 3: Add drag-to-pan in HexCanvas**

Add to the component:

```tsx
const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);

const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (e.button !== 1 && e.button !== 2) return; // middle or right mouse drag
  dragRef.current = { startX: e.clientX, startY: e.clientY, startTx: transform.tx, startTy: transform.ty };
};

const handleMouseUpDrag = () => { dragRef.current = null; };
```

Update `handleMouseMove` to include pan logic at the start:

```tsx
const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (dragRef.current) {
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onTransformChange({ ...transform, tx: dragRef.current.startTx + dx, ty: dragRef.current.startTy + dy });
    return;
  }
  // ... existing hover logic
};
```

Add `onMouseDown={handleMouseDown}` and `onMouseUp={handleMouseUpDrag}` to `<canvas>`.

**Also** enable space+drag pan by adding `onKeyDown`/`onKeyUp` state on the canvas container (tabIndex required):

```tsx
const spaceRef = useRef(false);

// In handleMouseDown, change condition to also allow left-click when space held:
if (e.button !== 1 && e.button !== 2 && !spaceRef.current) return;
```

Add `tabIndex={0} onKeyDown={e => { if (e.code === 'Space') spaceRef.current = true; }} onKeyUp={e => { if (e.code === 'Space') spaceRef.current = false; }}` to `<canvas>`.

- [ ] **Step 4: Test in browser**

`http://localhost:3000/mapa` — scroll wheel zooms toward cursor, middle-click drag or space+drag pans.

- [ ] **Step 5: Commit**

```bash
git add app/mapa/HexCanvas.tsx app/mapa/MapEditor.tsx
git commit -m "feat(mapa): zoom with scroll wheel, pan with middle-click/space+drag"
```

---

### Task 6: ToolSidebar — full implementation

**Files:**
- Modify: `app/mapa/ToolSidebar.tsx`

The sidebar has 4 tool modes: Select, Terrain, District, Wonder. Terrain/District/Wonder modes show a sub-picker below.

- [ ] **Step 1: Rewrite `app/mapa/ToolSidebar.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { MousePointer2, Paintbrush, Building2, Star, Eraser } from 'lucide-react';
import type { ToolMode } from './MapEditor';
import { TerrainType, DistrictType, WonderType, TERRAIN_LABELS, TERRAIN_COLORS } from '@/lib/map/types';
import { DistrictFactory } from '@/lib/map/District';
import { WONDER_META } from '@/lib/map/Wonder';

type TopMode = 'select' | 'terrain' | 'district' | 'wonder' | 'erase';

interface Props {
  activeTool: ToolMode;
  onToolChange: (t: ToolMode) => void;
}

export function ToolSidebar({ activeTool, onToolChange }: Props) {
  const [topMode, setTopMode] = useState<TopMode>('select');

  const selectTop = (mode: TopMode) => {
    setTopMode(mode);
    if (mode === 'select') onToolChange({ mode: 'select' });
    if (mode === 'erase') onToolChange({ mode: 'erase' });
  };

  return (
    <div className="flex h-screen">
      {/* Icon strip */}
      <div className="w-14 bg-[var(--civ-panel)] border-r border-[var(--civ-gold-500)]/20 flex flex-col items-center py-3 gap-1">
        {[
          { id: 'select' as TopMode, Icon: MousePointer2, label: 'Selecionar' },
          { id: 'terrain' as TopMode, Icon: Paintbrush,   label: 'Terreno' },
          { id: 'district' as TopMode, Icon: Building2,   label: 'Distrito' },
          { id: 'wonder' as TopMode, Icon: Star,          label: 'Maravilha' },
          { id: 'erase' as TopMode, Icon: Eraser,         label: 'Apagar' },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            title={label}
            onClick={() => selectTop(id)}
            className={`w-10 h-10 rounded flex items-center justify-center transition-colors
              ${topMode === id
                ? 'bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)]'
                : 'text-[var(--civ-gold-300)] hover:bg-[var(--civ-gold-500)]/20'}`}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>

      {/* Sub-picker panel */}
      {topMode === 'terrain' && (
        <TerrainPicker activeTool={activeTool} onToolChange={onToolChange} />
      )}
      {topMode === 'district' && (
        <DistrictPicker activeTool={activeTool} onToolChange={onToolChange} />
      )}
      {topMode === 'wonder' && (
        <WonderPicker activeTool={activeTool} onToolChange={onToolChange} />
      )}
    </div>
  );
}

function TerrainPicker({ activeTool, onToolChange }: { activeTool: ToolMode; onToolChange: (t: ToolMode) => void }) {
  const activeT = activeTool.mode === 'terrain' ? activeTool.terrain : null;
  return (
    <div className="w-52 bg-[var(--civ-blue-900)] border-r border-[var(--civ-gold-500)]/20 p-3 overflow-y-auto">
      <p className="text-[10px] uppercase tracking-widest text-[var(--civ-gold-300)]/70 mb-2">Terreno</p>
      <div className="flex flex-col gap-1">
        {Object.values(TerrainType).map(t => (
          <button
            key={t}
            onClick={() => onToolChange({ mode: 'terrain', terrain: t })}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors
              ${activeT === t ? 'bg-[var(--civ-gold-500)]/25 text-[var(--civ-gold-200)]' : 'text-[var(--civ-gold-100)]/70 hover:bg-white/5'}`}
          >
            <span
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: TERRAIN_COLORS[t] }}
            />
            {TERRAIN_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function DistrictPicker({ activeTool, onToolChange }: { activeTool: ToolMode; onToolChange: (t: ToolMode) => void }) {
  const activeD = activeTool.mode === 'district' ? activeTool.districtType : null;
  const allMeta = DistrictFactory.allMeta();
  return (
    <div className="w-52 bg-[var(--civ-blue-900)] border-r border-[var(--civ-gold-500)]/20 p-3 overflow-y-auto">
      <p className="text-[10px] uppercase tracking-widest text-[var(--civ-gold-300)]/70 mb-2">Distrito</p>
      <div className="flex flex-col gap-1">
        {allMeta.map(m => (
          <button
            key={m.type}
            onClick={() => onToolChange({ mode: 'district', districtType: m.type })}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors
              ${activeD === m.type ? 'bg-[var(--civ-gold-500)]/25 text-[var(--civ-gold-200)]' : 'text-[var(--civ-gold-100)]/70 hover:bg-white/5'}`}
          >
            <span className="w-5 font-mono font-bold text-center text-[10px]" style={{ color: m.color }}>
              {m.abbreviation}
            </span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WonderPicker({ activeTool, onToolChange }: { activeTool: ToolMode; onToolChange: (t: ToolMode) => void }) {
  const activeW = activeTool.mode === 'wonder' ? activeTool.wonderType : null;
  return (
    <div className="w-52 bg-[var(--civ-blue-900)] border-r border-[var(--civ-gold-500)]/20 p-3 overflow-y-auto">
      <p className="text-[10px] uppercase tracking-widest text-[var(--civ-gold-300)]/70 mb-2">Maravilha</p>
      <div className="flex flex-col gap-1">
        {Object.values(WONDER_META).map(m => (
          <button
            key={m.type}
            onClick={() => onToolChange({ mode: 'wonder', wonderType: m.type })}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors
              ${activeW === m.type ? 'bg-[var(--civ-gold-500)]/25 text-[var(--civ-gold-200)]' : 'text-[var(--civ-gold-100)]/70 hover:bg-white/5'}`}
          >
            <span style={{ color: m.color }}>★</span>
            <span className="leading-tight">
              {m.label}
              <span className="block text-[10px] text-[var(--civ-gold-300)]/50">{m.era}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Open `http://localhost:3000/mapa`. Click Paintbrush → choose Deserto → click tiles → verify they turn sandy color. Click Building2 → choose Campus → click tile → verify "CA" appears. Click Star → choose Pirâmides → click tile → verify ★ appears.

- [ ] **Step 3: Commit**

```bash
git add app/mapa/ToolSidebar.tsx
git commit -m "feat(mapa): full tool sidebar — terrain/district/wonder pickers"
```

---

### Task 7: TileConfigPanel — full implementation

**Files:**
- Modify: `app/mapa/TileConfigPanel.tsx`

Panel shows: terrain selector, feature selector, resource selector, improvement selector. If district present: list buildings with toggle checkboxes. If wonder present: show name. Erase district/wonder buttons.

- [ ] **Step 1: Rewrite `app/mapa/TileConfigPanel.tsx`**

```tsx
'use client';

import { Tile } from '@/lib/map/Tile';
import {
  TerrainType, FeatureType, ResourceType, ImprovementType,
  TERRAIN_LABELS, TERRAIN_COLORS, FEATURE_LABELS, BUILDING_LABELS,
} from '@/lib/map/types';
import type { BuildingType } from '@/lib/map/types';
import { X } from 'lucide-react';

interface Props {
  tile: Tile | null;
  onTileChange: (tile: Tile) => void;
}

export function TileConfigPanel({ tile, onTileChange }: Props) {
  if (!tile) {
    return (
      <div className="w-64 bg-[var(--civ-panel)] border-l border-[var(--civ-gold-500)]/20 p-4 flex items-center justify-center">
        <p className="text-xs text-[var(--civ-gold-300)]/50 text-center">
          Selecione um<br />tile no mapa
        </p>
      </div>
    );
  }

  const update = (mutate: (t: Tile) => void) => {
    const next = tile.clone();
    mutate(next);
    onTileChange(next);
  };

  return (
    <div className="w-64 bg-[var(--civ-panel)] border-l border-[var(--civ-gold-500)]/20 p-4 overflow-y-auto flex flex-col gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--civ-gold-300)]/60 mb-1">
          Posição
        </p>
        <p className="text-sm font-mono text-[var(--civ-gold-200)]">
          q={tile.coord.q}, r={tile.coord.r}
        </p>
      </div>

      {/* Terrain */}
      <ConfigSection label="Terreno">
        <select
          value={tile.terrain}
          onChange={e => update(t => { t.terrain = e.target.value as TerrainType; })}
          className="w-full bg-[var(--civ-blue-800)] text-[var(--civ-gold-100)] text-xs rounded px-2 py-1.5 border border-[var(--civ-gold-500)]/20"
        >
          {Object.values(TerrainType).map(t => (
            <option key={t} value={t}>{TERRAIN_LABELS[t]}</option>
          ))}
        </select>
        <div
          className="h-2 rounded mt-1"
          style={{ backgroundColor: TERRAIN_COLORS[tile.terrain] }}
        />
      </ConfigSection>

      {/* Feature */}
      <ConfigSection label="Acidente Geográfico">
        <select
          value={tile.feature}
          onChange={e => update(t => { t.feature = e.target.value as FeatureType; })}
          className="w-full bg-[var(--civ-blue-800)] text-[var(--civ-gold-100)] text-xs rounded px-2 py-1.5 border border-[var(--civ-gold-500)]/20"
        >
          {Object.values(FeatureType).map(f => (
            <option key={f} value={f}>{FEATURE_LABELS[f]}</option>
          ))}
        </select>
      </ConfigSection>

      {/* Resource */}
      <ConfigSection label="Recurso">
        <select
          value={tile.resource}
          onChange={e => update(t => { t.resource = e.target.value as ResourceType; })}
          className="w-full bg-[var(--civ-blue-800)] text-[var(--civ-gold-100)] text-xs rounded px-2 py-1.5 border border-[var(--civ-gold-500)]/20"
        >
          {Object.values(ResourceType).map(r => (
            <option key={r} value={r}>{r === 'none' ? 'Nenhum' : r}</option>
          ))}
        </select>
      </ConfigSection>

      {/* Improvement */}
      <ConfigSection label="Benfeitoria">
        <select
          value={tile.improvement}
          onChange={e => update(t => { t.improvement = e.target.value as ImprovementType; })}
          className="w-full bg-[var(--civ-blue-800)] text-[var(--civ-gold-100)] text-xs rounded px-2 py-1.5 border border-[var(--civ-gold-500)]/20"
        >
          {(['none','farm','mine','quarry','camp','pasture','fishing_boats','lumber_mill',
            'plantation','oil_well','offshore_oil_rig','airstrip','fort','trading_post'] as ImprovementType[]).map(i => (
            <option key={i} value={i}>{i === 'none' ? 'Nenhuma' : i.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </ConfigSection>

      {/* District */}
      {tile.district && (
        <ConfigSection label="Distrito">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: tile.district.color }}>
              {tile.district.label}
            </span>
            <button
              onClick={() => update(t => t.setDistrict(null))}
              className="text-[var(--civ-gold-300)]/50 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {tile.district.meta.availableBuildings.length > 0 && (
            <div className="flex flex-col gap-1">
              {tile.district.meta.availableBuildings.map(b => (
                <label key={b} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tile.district!.hasBuilding(b)}
                    onChange={e => update(t => {
                      if (e.target.checked) t.district?.addBuilding(b as BuildingType);
                      else t.district?.removeBuilding(b as BuildingType);
                    })}
                    className="accent-[var(--civ-gold-500)]"
                  />
                  <span className="text-xs text-[var(--civ-gold-100)]/80">
                    {BUILDING_LABELS[b]}
                  </span>
                </label>
              ))}
            </div>
          )}
        </ConfigSection>
      )}

      {/* Wonder */}
      {tile.wonder && (
        <ConfigSection label="Maravilha">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold" style={{ color: tile.wonder.color }}>
                ★ {tile.wonder.label}
              </span>
              <p className="text-[10px] text-[var(--civ-gold-300)]/50 mt-0.5">Era {tile.wonder.era}</p>
            </div>
            <button
              onClick={() => update(t => t.setWonder(null))}
              className="text-[var(--civ-gold-300)]/50 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </ConfigSection>
      )}
    </div>
  );
}

function ConfigSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[var(--civ-gold-300)]/60 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Select a tile → right panel shows dropdowns. Change terrain from dropdown → tile color updates on canvas. Place a Campus district on a tile → select it → see building checkboxes → toggle Library → building visible in panel. Press X next to district → district clears.

- [ ] **Step 3: Commit**

```bash
git add app/mapa/TileConfigPanel.tsx
git commit -m "feat(mapa): tile config panel — terrain/feature/resource/district buildings/wonder"
```

---

### Task 8: Grid expansion — add tiles on edges

**Files:**
- Modify: `app/mapa/MapEditor.tsx` (add expand handler)
- Modify: `app/mapa/HexCanvas.tsx` (draw + buttons on empty neighbor cells)

When user hovers over a hex that is adjacent to the grid boundary, show a faint "+" indicator. Clicking it adds that tile to the map.

- [ ] **Step 1: Add `onTileAdd` prop to HexCanvas**

In `app/mapa/HexCanvas.tsx`, update Props:

```tsx
interface Props {
  // ... existing ...
  onTileAdd: (coord: HexCoord) => void;
}
```

Add to `handleClick`:

```tsx
const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect = canvasRef.current!.getBoundingClientRect();
  const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);
  const coord = HexCoord.fromPixel(x, y, HEX_SIZE);
  if (hexMap.hasTile(coord)) {
    onTileClick(coord);
  } else {
    // Check if adjacent to existing tile (expansion candidate)
    const hasNeighbor = coord.neighbors().some(n => hexMap.hasTile(n));
    if (hasNeighbor) onTileAdd(coord);
  }
};
```

Draw ghost hexes for expansion candidates in `draw()`:

```tsx
// After drawing all tiles, draw ghost + for empty adjacent coords
const candidates = new Set<string>();
for (const tile of hexMap.allTiles()) {
  for (const n of tile.coord.neighbors()) {
    if (!hexMap.hasTile(n)) candidates.add(n.key());
  }
}
for (const key of candidates) {
  const coord = HexCoord.fromKey(key);
  const { x, y } = coord.toPixel(HEX_SIZE);
  const corners = hexCorners(x, y, HEX_SIZE - 1);
  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(218,183,103,0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(218,183,103,0.1)';
  ctx.fill();
  ctx.fillStyle = 'rgba(218,183,103,0.4)';
  ctx.font = `${HEX_SIZE * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', x, y);
}
```

- [ ] **Step 2: Add `handleTileAdd` in MapEditor**

```tsx
const handleTileAdd = useCallback((coord: HexCoord) => {
  const tile = new Tile(coord, TerrainType.Grassland);
  hexMap.setTile(coord, tile);
  setHexMap(hexMap);
  forceRedraw();
}, [hexMap, forceRedraw]);
```

Pass `onTileAdd={handleTileAdd}` to `<HexCanvas>`.

- [ ] **Step 3: Test in browser**

Grid edges show dashed hex outlines with `+`. Clicking one adds a new green tile. Newly added tile can be edited normally.

- [ ] **Step 4: Commit**

```bash
git add app/mapa/HexCanvas.tsx app/mapa/MapEditor.tsx
git commit -m "feat(mapa): grid expansion — click dashed border hex to add tile"
```

---

## Self-Review

**Spec coverage:**
- ✅ Hex grid with many hexagons
- ✅ Zoom (scroll wheel)
- ✅ Pan (middle-click / space+drag)
- ✅ Change terrain (paint tool → terrain picker)
- ✅ Change district (paint tool → district picker)
- ✅ Change wonder (paint tool → wonder picker)
- ✅ Modify district config (building checkboxes in right panel)
- ✅ Modify tile properties (terrain/feature/resource/improvement dropdowns)
- ✅ OOP for districts (abstract `District`, 15 subclasses, `DistrictFactory`)
- ✅ Expand grid (click dashed neighbor hex)

**Placeholder scan:** No TBD/TODO found. All code blocks complete.

**Type consistency check:**
- `ToolMode` defined in `MapEditor.tsx`, used in `ToolSidebar.tsx` — both imported correctly ✅
- `hexCorners` exported from `HexCoord.ts`, imported in `HexCanvas.tsx` ✅
- `Tile.clone()` used in `TileConfigPanel.tsx` — defined in `Tile.ts` ✅
- `DistrictFactory.allMeta()` used in `ToolSidebar.tsx` — defined in `District.ts` ✅
- `WONDER_META` exported from `Wonder.ts`, used in `ToolSidebar.tsx` ✅
- `BUILDING_LABELS` exported from `types.ts`, used in `TileConfigPanel.tsx` ✅
