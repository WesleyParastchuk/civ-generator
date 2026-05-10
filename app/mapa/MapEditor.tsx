'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { GameMap } from '@/lib/civ/GameMap';
import { HexCoord } from '@/lib/civ/HexCoord';
import { ToolId, Terrain, Feature, Resource } from '@/lib/civ/types';
import {
  SetTerrainAction, SetFeatureAction, SetResourceAction, SetPlacementAction,
  FogActivateAction,
} from '@/lib/civ/Action';
import { DistrictFactory } from '@/lib/civ/District';
import { WonderFactory } from '@/lib/civ/Wonder';
import { HexCanvas } from './HexCanvas';
import { Toolbar, defaultToolState } from './Toolbar';
import { StatsPanel } from './StatsPanel';
import { SubMenu } from './SubMenu';
import { findToolByDigit } from './shortcuts';
import { getSubMenuItems, TOOLS_WITH_SUBMENU } from './subMenuItems';

export type ToolState =
  | { id: ToolId.Select }
  | { id: ToolId.Pan }
  | { id: ToolId.Erase }
  | { id: ToolId.Fog }
  | { id: ToolId.Terrain;  payload: string }
  | { id: ToolId.Feature;  payload: string }
  | { id: ToolId.Resource; payload: string }
  | { id: ToolId.District; payload: string }
  | { id: ToolId.Wonder;   payload: string }
  | { id: ToolId.River };

type SubMenuState = { toolId: ToolId; page: number };

export function MapEditor() {
  const mapRef = useRef<GameMap>(GameMap.initial());
  const [tool, setTool] = useState<ToolState>({ id: ToolId.Select });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [subMenu, setSubMenu] = useState<SubMenuState | null>(null);
  const subMenuRef = useRef<SubMenuState | null>(null);
  subMenuRef.current = subMenu;

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

  const onSubMenuSelect = useCallback((payload: string) => {
    const sm = subMenuRef.current;
    if (!sm) return;
    switch (sm.toolId) {
      case ToolId.Terrain:  setTool({ id: ToolId.Terrain,  payload }); break;
      case ToolId.Feature:  setTool({ id: ToolId.Feature,  payload }); break;
      case ToolId.Resource: setTool({ id: ToolId.Resource, payload }); break;
      case ToolId.District: setTool({ id: ToolId.District, payload }); break;
      case ToolId.Wonder:   setTool({ id: ToolId.Wonder,   payload }); break;
    }
    setSubMenu(null);
  }, []);

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

      const sm = subMenuRef.current;
      if (sm) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSubMenu(null);
          return;
        }
        if (e.key === 'Tab' || e.key === '.') {
          e.preventDefault();
          const items = getSubMenuItems(sm.toolId);
          const maxPage = Math.ceil(items.length / 9) - 1;
          setSubMenu(s => s ? { ...s, page: Math.min(s.page + 1, maxPage) } : null);
          return;
        }
        if (e.key === ',') {
          e.preventDefault();
          setSubMenu(s => s ? { ...s, page: Math.max(s.page - 1, 0) } : null);
          return;
        }
        const digit = parseInt(e.key);
        if (digit >= 1 && digit <= 9) {
          e.preventDefault();
          const items = getSubMenuItems(sm.toolId);
          const index = sm.page * 9 + (digit - 1);
          if (items[index]) onSubMenuSelect(items[index].payload);
          return;
        }
      }

      const def = findToolByDigit(e.key);
      if (def) {
        e.preventDefault();
        setTool(defaultToolState(def));
        if (TOOLS_WITH_SUBMENU.includes(def.id)) {
          setSubMenu(s => (s?.toolId === def.id) ? null : { toolId: def.id, page: 0 });
        } else {
          setSubMenu(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bump, onSubMenuSelect]);

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
      <Toolbar tool={tool} onSelectTool={def => {
        setTool(defaultToolState(def));
        if (TOOLS_WITH_SUBMENU.includes(def.id)) {
          setSubMenu(s => (s?.toolId === def.id) ? null : { toolId: def.id, page: 0 });
        } else {
          setSubMenu(null);
        }
      }} />
      {subMenu && (
        <SubMenu
          toolId={subMenu.toolId}
          page={subMenu.page}
          onSelect={onSubMenuSelect}
          onPageChange={page => setSubMenu(s => s ? { ...s, page } : null)}
          onClose={() => setSubMenu(null)}
        />
      )}
      <StatsPanel map={mapRef.current} selectedKey={selectedKey} />
    </div>
  );
}
