const SQ3 = Math.sqrt(3);

export class HexCoord {
  constructor(readonly q: number, readonly r: number) {}

  get s(): number { return -this.q - this.r; }

  key(): string { return `${this.q},${this.r}`; }

  static fromKey(key: string): HexCoord {
    const [q, r] = key.split(',').map(Number);
    return new HexCoord(q, r);
  }

  equals(other: HexCoord): boolean {
    return this.q === other.q && this.r === other.r;
  }

  toPixel(size: number): { x: number; y: number } {
    return {
      x: size * (SQ3 * this.q + (SQ3 / 2) * this.r),
      y: size * (1.5 * this.r),
    };
  }

  static fromPixel(x: number, y: number, size: number): HexCoord {
    const q = ((SQ3 / 3) * x - (1 / 3) * y) / size;
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
    return DIRS.map(([dq, dr]) => new HexCoord(this.q + dq, this.r + dr));
  }

  distance(other: HexCoord): number {
    return (Math.abs(this.q - other.q) +
            Math.abs(this.r - other.r) +
            Math.abs(this.s - other.s)) / 2;
  }

  range(radius: number): HexCoord[] {
    const out: HexCoord[] = [];
    for (let dq = -radius; dq <= radius; dq++) {
      const rMin = Math.max(-radius, -dq - radius);
      const rMax = Math.min(radius, -dq + radius);
      for (let dr = rMin; dr <= rMax; dr++) {
        out.push(new HexCoord(this.q + dq, this.r + dr));
      }
    }
    return out;
  }
}

const DIRS: [number, number][] = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

export function hexCorners(cx: number, cy: number, size: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
  });
}
