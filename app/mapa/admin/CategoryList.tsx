'use client';

import { ConfigCategory } from '@/lib/civ/ConfigStore';

const CATEGORIES: { id: ConfigCategory; label: string }[] = [
  { id: 'terrain',  label: 'Terreno' },
  { id: 'feature',  label: 'Característica' },
  { id: 'resource', label: 'Recurso' },
  { id: 'district', label: 'Distrito' },
  { id: 'wonder',   label: 'Maravilha' },
];

interface Props {
  active: ConfigCategory;
  onChange: (cat: ConfigCategory) => void;
}

export function CategoryList({ active, onChange }: Props) {
  return (
    <nav className="flex flex-col gap-1">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors
            ${active === cat.id
              ? 'bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)]'
              : 'text-[var(--civ-gold-300)] hover:bg-[var(--civ-gold-500)]/20'}`}
        >
          {cat.label}
        </button>
      ))}
    </nav>
  );
}
