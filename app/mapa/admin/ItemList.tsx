'use client';

import { ConfigCategory, ConfigItem, ConfigStore } from '@/lib/civ/ConfigStore';
import { ensureSeeded } from '@/lib/civ/defaultItems';

interface Props {
  category: ConfigCategory;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  version: number;
}

export function ItemList({ category, selectedKey, onSelect, version }: Props) {
  void version; // forces re-render when parent bumps version
  const items = ensureSeeded(category);

  const toggle = (item: ConfigItem, e: React.MouseEvent) => {
    e.stopPropagation();
    ConfigStore.updateItem(category, item.key, { enabled: !item.enabled });
  };

  const remove = (item: ConfigItem, e: React.MouseEvent) => {
    e.stopPropagation();
    ConfigStore.removeCustomItem(category, item.key);
    if (selectedKey === item.key) onSelect('');
  };

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {items.map(item => (
        <div
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
            ${selectedKey === item.key
              ? 'bg-[var(--civ-gold-500)]/30 text-[var(--civ-gold-100)]'
              : 'text-[var(--civ-gold-200)] hover:bg-[var(--civ-gold-500)]/10'}
            ${!item.enabled ? 'opacity-40' : ''}`}
        >
          {item.icon ? (
            item.icon.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.icon} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
            ) : (
              <span className="w-5 text-center text-base shrink-0">{item.icon}</span>
            )
          ) : (
            <span className="w-4 h-4 rounded shrink-0 border border-white/10" style={{ backgroundColor: item.color }} />
          )}
          <span className="truncate flex-1 text-sm">{item.label}</span>
          {item.isCustom && (
            <span className="text-[10px] text-[var(--civ-gold-500)]/60 shrink-0">custom</span>
          )}
          <button
            onClick={e => toggle(item, e)}
            title={item.enabled ? 'Ocultar' : 'Mostrar'}
            className="shrink-0 text-[10px] text-[var(--civ-gold-300)]/50 hover:text-[var(--civ-gold-300)] transition-colors"
          >
            {item.enabled ? '👁' : '🙈'}
          </button>
          {item.isCustom && (
            <button
              onClick={e => remove(item, e)}
              title="Remover"
              className="shrink-0 text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
