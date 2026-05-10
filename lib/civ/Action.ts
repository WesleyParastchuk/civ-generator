import { HexCoord } from './HexCoord';
import { HexTile } from './HexTile';
import { GameMap } from './GameMap';
import { Terrain } from './types';
import { Placement } from './Placement';

export interface Action {
  readonly description: string;
  apply(map: GameMap): void;
  revert(map: GameMap): void;
}

export class SetTerrainAction implements Action {
  readonly description: string;
  private prev?: string;
  constructor(readonly coord: HexCoord, readonly next: string) {
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
  private prev?: string;
  constructor(readonly coord: HexCoord, readonly next: string) {
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
  private prev?: string;
  constructor(readonly coord: HexCoord, readonly next: string) {
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

export class FogActivateAction implements Action {
  readonly description: string;
  private prevTerrain?: string;
  private spawnedKeys: string[] = [];
  constructor(readonly coord: HexCoord, readonly nextTerrain: string) {
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
