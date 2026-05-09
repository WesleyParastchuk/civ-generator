'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GameMap } from '@/lib/civ/GameMap';
import { HexCoord, hexCorners } from '@/lib/civ/HexCoord';
import { TERRAIN_COLORS, Terrain, ToolId } from '@/lib/civ/types';
import { District } from '@/lib/civ/District';
import { Wonder } from '@/lib/civ/Wonder';
import type { ToolState } from './MapEditor';

const SIZE = 38;

interface Props {
  map: GameMap;
  version: number;
  selectedKey: string | null;
  tool: ToolState;
  onApplyTool: (coord: HexCoord) => void;
  onMutate: () => void;
}

type Transform = { scale: number; tx: number; ty: number };

export function HexCanvas({ map, version, selectedKey, tool, onApplyTool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tf = useRef<Transform>({ scale: 1, tx: 0, ty: 0 });
  const hov = useRef<string | null>(null);
  const drag = useRef<{ sx: number; sy: number; stx: number; sty: number } | null>(null);
  const didDrag = useRef(false);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const { scale, tx, ty } = tf.current;

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, tx, ty);

    for (const tile of map.allTiles()) {
      const { x, y } = tile.coord.toPixel(SIZE);
      const cs = hexCorners(x, y, SIZE - 1);
      const key = tile.coord.key();
      const isSel = key === selectedKey;
      const isHov = key === hov.current;

      ctx.beginPath();
      ctx.moveTo(cs[0][0], cs[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(cs[i][0], cs[i][1]);
      ctx.closePath();

      ctx.fillStyle = TERRAIN_COLORS[tile.terrain];
      ctx.fill();

      if (tile.terrain === Terrain.Fog) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();
      }
      if (isSel) {
        ctx.fillStyle = 'rgba(218,183,103,0.30)';
        ctx.fill();
      } else if (isHov) {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fill();
      }

      ctx.strokeStyle = isSel ? '#dab767' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.stroke();

      if (tile.placement instanceof District) {
        ctx.fillStyle = tile.placement.color;
        ctx.font = `bold ${SIZE * 0.4}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.placement.abbr, x, y);
      } else if (tile.placement instanceof Wonder) {
        ctx.fillStyle = tile.placement.color;
        ctx.font = `${SIZE * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x, y);
      }
    }

    ctx.restore();
  }, [map, selectedKey, version]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
      if (tf.current.tx === 0 && tf.current.ty === 0) {
        tf.current = { scale: 1, tx: c.width / 2, ty: c.height / 2 };
      }
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    resize();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { scale, tx, ty } = tf.current;
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const ns = Math.max(0.25, Math.min(5, scale * f));
      tf.current = {
        scale: ns,
        tx: cx - (cx - tx) * (ns / scale),
        ty: cy - (cy - ty) * (ns / scale),
      };
      draw();
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [draw]);

  const worldPos = (cx: number, cy: number) => {
    const { scale, tx, ty } = tf.current;
    return { x: (cx - tx) / scale, y: (cy - ty) / scale };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || tool.id === ToolId.Pan) {
      drag.current = { sx: e.clientX, sy: e.clientY, stx: tf.current.tx, sty: tf.current.ty };
      didDrag.current = false;
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const c = canvasRef.current!;
    if (drag.current) {
      didDrag.current = true;
      tf.current = {
        ...tf.current,
        tx: drag.current.stx + (e.clientX - drag.current.sx),
        ty: drag.current.sty + (e.clientY - drag.current.sy),
      };
      draw();
      return;
    }
    const rect = c.getBoundingClientRect();
    const { x, y } = worldPos(e.clientX - rect.left, e.clientY - rect.top);
    const coord = HexCoord.fromPixel(x, y, SIZE);
    const next = map.hasTile(coord) ? coord.key() : null;
    if (next !== hov.current) {
      hov.current = next;
      draw();
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || tool.id === ToolId.Pan) drag.current = null;
  };

  const onMouseLeave = () => { hov.current = null; draw(); };

  const onClick = (e: React.MouseEvent) => {
    if (didDrag.current) { didDrag.current = false; return; }
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const { x, y } = worldPos(e.clientX - rect.left, e.clientY - rect.top);
    const coord = HexCoord.fromPixel(x, y, SIZE);
    if (map.hasTile(coord)) {
      onApplyTool(coord);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: tool.id === ToolId.Pan ? 'grab' : 'crosshair' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onContextMenu={e => e.preventDefault()}
    />
  );
}
