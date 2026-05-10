import { ToolId } from '@/lib/civ/types';
import { ConfigCategory, ConfigItem } from '@/lib/civ/ConfigStore';
import { ensureSeeded } from '@/lib/civ/defaultItems';

export interface SubMenuItem {
  key: string;
  label: string;
  color: string;
  icon?: string;
  payload: string;
}

const TOOL_CATEGORY: Partial<Record<ToolId, ConfigCategory>> = {
  [ToolId.Terrain]:  'terrain',
  [ToolId.Feature]:  'feature',
  [ToolId.Resource]: 'resource',
  [ToolId.District]: 'district',
  [ToolId.Wonder]:   'wonder',
};

function cfgToMenuItem(item: ConfigItem): SubMenuItem {
  return { key: item.key, label: item.label, color: item.color, icon: item.icon, payload: item.key };
}

export function getSubMenuItems(toolId: ToolId): SubMenuItem[] {
  const cat = TOOL_CATEGORY[toolId];
  if (!cat) return [];
  const list = ensureSeeded(cat);
  return list.filter(i => i.enabled).map(cfgToMenuItem);
}

export const TOOLS_WITH_SUBMENU: ToolId[] = [
  ToolId.Terrain, ToolId.Feature, ToolId.Resource, ToolId.District, ToolId.Wonder,
];
