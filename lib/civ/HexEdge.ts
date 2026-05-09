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
