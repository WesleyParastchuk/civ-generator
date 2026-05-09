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
