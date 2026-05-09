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
