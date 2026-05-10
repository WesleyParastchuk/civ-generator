'use client';

import { useEffect, useRef } from 'react';
import { ToolId, Terrain, Feature, Resource, DistrictType, WonderType } from '@/lib/civ/types';
import { getSubMenuItems, SubMenuItem } from './subMenuItems';

const PAGE_SIZE = 9;

interface Props {
  toolId: ToolId;
  page: number;
  onSelect: (payload: Terrain | Feature | Resource | DistrictType | WonderType) => void;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export function SubMenu({ toolId, page, onSelect, onPageChange, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const items = getSubMenuItems(toolId);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const visible: SubMenuItem[] = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-[72px] left-1/2 -translate-x-1/2 z-20 bg-[var(--civ-panel)] border border-[var(--civ-gold-500)]/30 rounded-md shadow-lg p-2 pointer-events-auto"
      style={{ minWidth: 360 }}
    >
      <div className="grid grid-cols-3 gap-1">
        {visible.map((item, i) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.payload)}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--civ-gold-500)]/20 text-left text-xs text-[var(--civ-gold-100)] transition-colors"
          >
            <span className="text-[10px] font-mono text-[var(--civ-gold-300)]/60 w-3 shrink-0">{i + 1}</span>
            {item.icon ? (
              item.icon.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
              ) : (
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              )
            ) : (
              <span className="w-5 h-5 rounded shrink-0 border border-white/10" style={{ backgroundColor: item.color }} />
            )}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-[var(--civ-gold-500)]/20 text-xs text-[var(--civ-gold-300)]/70">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2 py-0.5 rounded hover:bg-[var(--civ-gold-500)]/20 disabled:opacity-30 transition-colors"
          >
            ‹
          </button>
          <span className="font-mono">{page + 1}/{totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-2 py-0.5 rounded hover:bg-[var(--civ-gold-500)]/20 disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
