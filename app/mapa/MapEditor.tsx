'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { GameMap } from '@/lib/civ/GameMap';
import { HexCoord } from '@/lib/civ/HexCoord';
import { ToolId, Terrain, Feature, Resource, DistrictType, WonderType } from '@/lib/civ/types';
import {
  SetTerrainAction, SetFeatureAction, SetResourceAction, SetPlacementAction,
  FogActivateAction,
} from '@/lib/civ/Action';
import { DistrictFactory } from '@/lib/civ/District';
import { WonderFactory } from '@/lib/civ/Wonder';
import { HexCanvas } from './HexCanvas';
import { Toolbar, defaultToolState } from './Toolbar';
import { StatsPanel } from './StatsPanel';
import { findToolByDigit } from './shortcuts';

export type ToolState =
  | { id: ToolId.Select }
  | { id: ToolId.Pan }
  | { id: ToolId.Erase }
  | { id: ToolId.Fog }
  | { id: ToolId.Terrain;  payload: Terrain }
  | { id: ToolId.Feature;  payload: Feature }
  | { id: ToolId.Resource; payload: Resource }
  | { id: ToolId.District; payload: DistrictType }
  | { id: ToolId.Wonder;   payload: WonderType }
  | { id: ToolId.River };

export function MapEditor() {
  const mapRef = useRef<GameMap>(GameMap.initial());
  const [tool, setTool] = useState<ToolState>({ id: ToolId.Select });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion(v => v + 1), []);

  const applyTool = useCallback((coord: HexCoord) => {
    const map = mapRef.current;
    const tile = map.getTile(coord);
    if (!tile) return;

    switch (tool.id) {
      case ToolId.Select:
        setSelectedKey(coord.key());
        return;

      case ToolId.Pan:
        return;

      case ToolId.Terrain:
        map.perform(new SetTerrainAction(coord, tool.payload));
        break;

      case ToolId.Feature:
        map.perform(new SetFeatureAction(coord, tool.payload));
        break;

      case ToolId.Resource:
        map.perform(new SetResourceAction(coord, tool.payload));
        break;

      case ToolId.District:
        map.perform(new SetPlacementAction(coord, DistrictFactory.create(tool.payload)));
        break;

      case ToolId.Wonder:
        map.perform(new SetPlacementAction(coord, WonderFactory.create(tool.payload)));
        break;

      case ToolId.Erase:
        map.perform(new SetPlacementAction(coord, null));
        break;

      case ToolId.Fog:
        if (tile.terrain === Terrain.Fog) {
          map.perform(new FogActivateAction(coord, Terrain.Grassland));
        }
        break;

      case ToolId.River: {
        const edgeAction = {
          description: 'Toggle rio (borda 0)',
          _prev: undefined as boolean | undefined,
          apply(m: GameMap) {
            const t = m.getTile(coord); if (!t) return;
            this._prev = t.edges[0].hasRiver;
            t.edges[0].hasRiver = !this._prev;
          },
          revert(m: GameMap) {
            const t = m.getTile(coord); if (!t || this._prev === undefined) return;
            t.edges[0].hasRiver = this._prev;
          },
        };
        map.perform(edgeAction);
        break;
      }
    }

    setSelectedKey(coord.key());
    bump();
  }, [tool, bump]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        const undid = mapRef.current.undo();
        if (undid) bump();
        return;
      }

      const def = findToolByDigit(e.key);
      if (def) {
        e.preventDefault();
        setTool(defaultToolState(def));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bump]);

  return (
    <div className="w-screen h-screen bg-[var(--civ-blue-950)] relative overflow-hidden">
      <HexCanvas
        map={mapRef.current}
        version={version}
        selectedKey={selectedKey}
        tool={tool}
        onApplyTool={applyTool}
        onMutate={bump}
      />
      <Toolbar tool={tool} onSelectTool={def => setTool(defaultToolState(def))} />
      <StatsPanel map={mapRef.current} selectedKey={selectedKey} />
    </div>
  );
}
