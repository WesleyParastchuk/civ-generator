import type { HexTile } from './HexTile';
import type { GameMap } from './GameMap';
import { Placement } from './Placement';
import { Stats } from './Stats';
import { Building, BuildingType, makeBuilding } from './Building';
import {
  Requirement, RequireNoExistingPlacement, RequireNotWater, RequireCoastal,
  RequireFlat,
} from './Requirement';
import { DistrictType, Terrain, Resource, Feature, isHills } from './types';
import { ConfigStore } from './ConfigStore';

interface DistrictMeta {
  type: DistrictType;
  name: string;
  color: string;
  abbr: string;
  buildings: BuildingType[];
}

export const DISTRICT_META: Record<DistrictType, DistrictMeta> = {
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
  abstract readonly type: string;
  buildings: Building[] = [];

  get meta(): DistrictMeta { return DISTRICT_META[this.type as DistrictType]; }
  get name(): string {
    const item = ConfigStore.getList('district').find(i => i.key === this.type);
    return item?.label ?? this.meta?.name ?? this.type;
  }
  get color(): string {
    const item = ConfigStore.getList('district').find(i => i.key === this.type);
    return item?.color ?? this.meta?.color ?? '#888888';
  }
  get abbr(): string { return this.meta?.abbr ?? this.type.slice(0, 2).toUpperCase(); }
  get availableBuildings(): BuildingType[] { return this.meta?.buildings ?? []; }

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

  readonly requirements: Requirement[] = [
    new RequireNoExistingPlacement(),
    new RequireNotWater(),
  ];

  abstract getAdjacencyBonus(tile: HexTile, map: GameMap): Stats;

  getEffect(tile: HexTile, map: GameMap): Stats {
    const s = this.buildingsStats().add(this.getAdjacencyBonus(tile, map));
    const item = ConfigStore.getList('district').find(i => i.key === this.type);
    if (item && Object.keys(item.yields).length > 0) s.add(Stats.of(item.yields));
    return s;
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
    s += ns.filter(n => n.terrain === Terrain.Mountain).length * 1;
    s += Math.floor(ns.filter(n => n.feature === Feature.Forest || n.feature === Feature.Rainforest).length / 2);
    s += Math.floor(ns.filter(n => n.placement instanceof District && !(n.placement instanceof CityCenter)).length / 2);
    return Stats.of({ science: s });
  }
}

export class CommercialHub extends District { readonly type = DistrictType.CommercialHub;
  getAdjacencyBonus(tile: HexTile, map: GameMap): Stats {
    const ns = map.neighbors(tile.coord);
    let g = 0;
    if (tile.edges.some(e => e.hasRiver)) g += 2;
    if (ns.some(n => n.placement instanceof Harbor)) g += 2;
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
    p += ns.filter(n => isHills(n.terrain)).length;
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
    const strategic = new Set<string>([Resource.Horses, Resource.Iron, Resource.Niter, Resource.Coal, Resource.Oil, Resource.Aluminum, Resource.Uranium]);
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

export class GenericDistrict extends District {
  readonly type: string;
  constructor(key: string) { super(); this.type = key; }
  getAdjacencyBonus(): Stats { return Stats.zero(); }
}

export class DistrictFactory {
  static create(key: string): District {
    switch (key as DistrictType) {
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
      default:                                return new GenericDistrict(key);
    }
  }

  static all(): District[] {
    return Object.values(DistrictType).map(t => DistrictFactory.create(t));
  }
}
