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

  perform(action: Action): void {
    this.history.push(action, this);
  }

  undo(): boolean {
    return this.history.undo(this) !== null;
  }

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
