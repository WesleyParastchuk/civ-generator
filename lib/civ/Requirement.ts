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
