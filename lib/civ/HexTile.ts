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
  [Resource.None]:      Stats.zero(),
  [Resource.Wheat]:     Stats.of({ food: 1 }),
  [Resource.Rice]:      Stats.of({ food: 1 }),
  [Resource.Cattle]:    Stats.of({ food: 1 }),
  [Resource.Sheep]:     Stats.of({ food: 1 }),
  [Resource.Deer]:      Stats.of({ food: 1 }),
  [Resource.Bananas]:   Stats.of({ food: 1 }),
  [Resource.Fish]:      Stats.of({ food: 1 }),
  [Resource.Crabs]:     Stats.of({ food: 1 }),
  [Resource.Stone]:     Stats.of({ production: 1 }),
  [Resource.Copper]:    Stats.of({ gold: 2 }),
  [Resource.Wine]:      Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Silk]:      Stats.of({ culture: 1, amenities: 1 }),
  [Resource.Citrus]:    Stats.of({ food: 2, amenities: 1 }),
  [Resource.Cotton]:    Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Diamonds]:  Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Furs]:      Stats.of({ food: 1, gold: 2, amenities: 1 }),
  [Resource.Ivory]:     Stats.of({ production: 1, gold: 2, amenities: 1 }),
  [Resource.Jade]:      Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Pearls]:    Stats.of({ faith: 2, amenities: 1 }),
  [Resource.Salt]:      Stats.of({ food: 1, gold: 2, amenities: 1 }),
  [Resource.Silver]:    Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Spices]:    Stats.of({ food: 2, amenities: 1 }),
  [Resource.Sugar]:     Stats.of({ food: 2, amenities: 1 }),
  [Resource.Tea]:       Stats.of({ science: 1, amenities: 1 }),
  [Resource.Tobacco]:   Stats.of({ faith: 1, gold: 2, amenities: 1 }),
  [Resource.Truffles]:  Stats.of({ gold: 3, amenities: 1 }),
  [Resource.Horses]:    Stats.of({ food: 1, production: 1 }),
  [Resource.Iron]:      Stats.of({ science: 1, production: 1 }),
  [Resource.Niter]:     Stats.of({ food: 1, production: 1 }),
  [Resource.Coal]:      Stats.of({ production: 2 }),
  [Resource.Oil]:       Stats.of({ production: 3 }),
  [Resource.Aluminum]:  Stats.of({ science: 1, production: 1 }),
  [Resource.Uranium]:   Stats.of({ production: 2 }),
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
