import { Placement } from './Placement';
import { Stats } from './Stats';
import {
  Requirement, RequireNoExistingPlacement, RequireNotWater,
  RequireRiverAdjacent, RequireFlat, RequireHills, RequireCoastal,
} from './Requirement';
import { WonderType } from './types';
import { ConfigStore } from './ConfigStore';
import type { HexTile } from './HexTile';
import type { GameMap } from './GameMap';

interface WonderData {
  type: WonderType;
  name: string;
  era: string;
  color: string;
  effect: Stats;
  extraReqs: Requirement[];
}

export const WONDER_DATA: Record<WonderType, WonderData> = {
  [WonderType.Pyramids]:        { type: WonderType.Pyramids,        name: 'Pirâmides',            era: 'Antiga',     color: '#c8a031', effect: Stats.of({ culture: 2 }), extraReqs: [] },
  [WonderType.Stonehenge]:      { type: WonderType.Stonehenge,      name: 'Stonehenge',           era: 'Antiga',     color: '#9e9e9e', effect: Stats.of({ faith: 2 }), extraReqs: [new RequireFlat()] },
  [WonderType.HangingGardens]:  { type: WonderType.HangingGardens,  name: 'Jardins Suspensos',    era: 'Antiga',     color: '#66bb6a', effect: Stats.of({ food: 2, housing: 2 }), extraReqs: [new RequireRiverAdjacent()] },
  [WonderType.GreatLibrary]:    { type: WonderType.GreatLibrary,    name: 'Grande Biblioteca',    era: 'Clássica',   color: '#f5e642', effect: Stats.of({ science: 2 }), extraReqs: [] },
  [WonderType.Oracle]:          { type: WonderType.Oracle,          name: 'Oráculo',              era: 'Clássica',   color: '#a8c8e8', effect: Stats.of({ culture: 1, faith: 1 }), extraReqs: [new RequireHills()] },
  [WonderType.Colosseum]:       { type: WonderType.Colosseum,       name: 'Coliseu',              era: 'Clássica',   color: '#e0c060', effect: Stats.of({ culture: 3, amenities: 3 }), extraReqs: [] },
  [WonderType.Petra]:           { type: WonderType.Petra,           name: 'Petra',                era: 'Clássica',   color: '#e8b070', effect: Stats.of({ food: 2, gold: 2, culture: 1 }), extraReqs: [] },
  [WonderType.HagiaSophia]:     { type: WonderType.HagiaSophia,     name: 'Hagia Sophia',         era: 'Medieval',   color: '#e8c89a', effect: Stats.of({ faith: 4 }), extraReqs: [] },
  [WonderType.MachuPicchu]:     { type: WonderType.MachuPicchu,     name: 'Machu Picchu',         era: 'Medieval',   color: '#8fbc8f', effect: Stats.of({ gold: 4, production: 2 }), extraReqs: [new RequireHills()] },
  [WonderType.ChichenItza]:     { type: WonderType.ChichenItza,     name: 'Chichén Itzá',         era: 'Medieval',   color: '#c8a850', effect: Stats.of({ culture: 2, production: 2 }), extraReqs: [] },
  [WonderType.ForbiddenCity]:   { type: WonderType.ForbiddenCity,   name: 'Cidade Proibida',      era: 'Renascença', color: '#8b0000', effect: Stats.of({ culture: 5 }), extraReqs: [] },
  [WonderType.TajMahal]:        { type: WonderType.TajMahal,        name: 'Taj Mahal',            era: 'Renascença', color: '#f8f8f8', effect: Stats.of({ culture: 4 }), extraReqs: [new RequireRiverAdjacent()] },
  [WonderType.Versailles]:      { type: WonderType.Versailles,      name: 'Palácio de Versalhes', era: 'Renascença', color: '#ffd700', effect: Stats.of({ culture: 3 }), extraReqs: [] },
  [WonderType.BigBen]:          { type: WonderType.BigBen,          name: 'Big Ben',              era: 'Industrial', color: '#a0a0a0', effect: Stats.of({ gold: 6, culture: 2 }), extraReqs: [new RequireRiverAdjacent()] },
  [WonderType.EiffelTower]:     { type: WonderType.EiffelTower,     name: 'Torre Eiffel',         era: 'Moderna',    color: '#b0b0b0', effect: Stats.of({ appeal: 2, culture: 2 }), extraReqs: [] },
  [WonderType.StatueOfLiberty]: { type: WonderType.StatueOfLiberty, name: 'Estátua da Liberdade', era: 'Moderna',    color: '#78a878', effect: Stats.of({ culture: 4 }), extraReqs: [new RequireCoastal()] },
  [WonderType.CristoRedentor]:  { type: WonderType.CristoRedentor,  name: 'Cristo Redentor',      era: 'Moderna',    color: '#e0e0e0', effect: Stats.of({ culture: 4, faith: 4 }), extraReqs: [] },
};

export class Wonder extends Placement {
  constructor(readonly type: WonderType) { super(); }

  get data(): WonderData { return WONDER_DATA[this.type]; }
  private cfgItem() { return ConfigStore.getList('wonder').find(i => i.key === this.type); }
  get name(): string { return this.cfgItem()?.label ?? this.data.name; }
  get era(): string { return this.data.era; }
  get color(): string { return this.cfgItem()?.color ?? this.data.color; }

  get requirements(): Requirement[] {
    return [new RequireNoExistingPlacement(), new RequireNotWater(), ...this.data.extraReqs];
  }

  getEffect(_tile: HexTile, _map: GameMap): Stats {
    const item = this.cfgItem();
    if (item && Object.keys(item.yields).length > 0) return Stats.of(item.yields);
    return this.data.effect.clone();
  }
}

export class GenericWonder extends Placement {
  constructor(readonly key: string) { super(); }

  private cfgItem() { return ConfigStore.getList('wonder').find(i => i.key === this.key); }
  get name(): string { return this.cfgItem()?.label ?? this.key; }
  get color(): string { return this.cfgItem()?.color ?? '#ffffff'; }

  readonly requirements: Requirement[] = [new RequireNoExistingPlacement(), new RequireNotWater()];

  getEffect(_tile: HexTile, _map: GameMap): Stats {
    const item = this.cfgItem();
    if (!item) return Stats.zero();
    return Stats.of(item.yields);
  }
}

export class WonderFactory {
  static create(key: string): Wonder | GenericWonder {
    if (Object.values(WonderType).includes(key as WonderType)) return new Wonder(key as WonderType);
    return new GenericWonder(key);
  }
  static all(): Wonder[] {
    return Object.values(WonderType).map(t => new Wonder(t as WonderType));
  }
}
