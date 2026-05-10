'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConfigCategory } from '@/lib/civ/ConfigStore';
import { CategoryList } from './CategoryList';
import { ItemList } from './ItemList';
import { ItemEditor } from './ItemEditor';

export function AdminEditor() {
  const [category, setCategory] = useState<ConfigCategory>('terrain');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const handleCategoryChange = (cat: ConfigCategory) => {
    setCategory(cat);
    setSelectedKey(null);
  };

  return (
    <div className="w-screen h-screen bg-[var(--civ-blue-950)] flex flex-col text-[var(--civ-gold-100)]">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--civ-gold-500)]/20 shrink-0">
        <Link
          href="/mapa"
          className="text-[var(--civ-gold-300)] hover:text-[var(--civ-gold-100)] text-sm transition-colors"
        >
          ← Voltar ao Mapa
        </Link>
        <h1 className="text-[var(--civ-gold-400)] font-semibold">Admin — Configurações do Mapa</h1>
      </header>

      {/* Body: 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Categories */}
        <div className="w-44 shrink-0 border-r border-[var(--civ-gold-500)]/20 p-3 overflow-y-auto bg-[var(--civ-blue-950)]">
          <CategoryList active={category} onChange={handleCategoryChange} />
        </div>

        {/* Column 2: Item list */}
        <div className="w-56 shrink-0 border-r border-[var(--civ-gold-500)]/20 p-2 overflow-y-auto bg-[var(--civ-blue-950)]">
          <ItemList
            key={`${category}-${listVersion}`}
            category={category}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
        </div>

        {/* Column 3: Editor */}
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--civ-blue-950)]">
          {selectedKey ? (
            <ItemEditor
              key={`${category}-${selectedKey}`}
              category={category}
              itemKey={selectedKey}
              onSaved={() => setListVersion(v => v + 1)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--civ-gold-300)]/40 text-sm">
              Selecione um item para editar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
