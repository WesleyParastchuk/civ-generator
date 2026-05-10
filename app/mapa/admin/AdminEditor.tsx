'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConfigCategory } from '@/lib/civ/ConfigStore';
import { CategoryList } from './CategoryList';
import { ItemList } from './ItemList';
import { ItemEditor } from './ItemEditor';
import { AddItemForm } from './AddItemForm';

export function AdminEditor() {
  const [category, setCategory] = useState<ConfigCategory>('terrain');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [adding, setAdding] = useState(false);

  const handleCategoryChange = (cat: ConfigCategory) => {
    setCategory(cat);
    setSelectedKey(null);
    setAdding(false);
  };

  const handleSaved = () => setListVersion(v => v + 1);

  const handleAdded = (key: string) => {
    setListVersion(v => v + 1);
    setSelectedKey(key);
    setAdding(false);
  };

  return (
    <div className="w-screen h-screen bg-[var(--civ-blue-950)] flex flex-col text-[var(--civ-gold-100)]">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--civ-gold-500)]/20 shrink-0">
        <Link
          href="/mapa"
          className="text-[var(--civ-gold-300)] hover:text-[var(--civ-gold-100)] text-sm transition-colors"
        >
          ← Voltar ao Mapa
        </Link>
        <h1 className="text-[var(--civ-gold-400)] font-semibold">Admin — Configurações do Mapa</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Categories */}
        <div className="w-44 shrink-0 border-r border-[var(--civ-gold-500)]/20 p-3 overflow-y-auto bg-[var(--civ-blue-950)]">
          <CategoryList active={category} onChange={handleCategoryChange} />
        </div>

        {/* Column 2: Item list + add button */}
        <div className="w-56 shrink-0 border-r border-[var(--civ-gold-500)]/20 flex flex-col bg-[var(--civ-blue-950)]">
          <div className="flex-1 p-2 overflow-y-auto">
            <ItemList
              category={category}
              selectedKey={selectedKey}
              onSelect={key => { setSelectedKey(key); setAdding(false); }}
              version={listVersion}
            />
          </div>
          <div className="p-2 border-t border-[var(--civ-gold-500)]/20 shrink-0">
            <button
              onClick={() => { setAdding(true); setSelectedKey(null); }}
              className="w-full py-1.5 rounded border border-[var(--civ-gold-500)]/30 text-[var(--civ-gold-300)] text-xs hover:bg-[var(--civ-gold-500)]/20 transition-colors"
            >
              + Novo item
            </button>
          </div>
        </div>

        {/* Column 3: Editor / Add form */}
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--civ-blue-950)]">
          {adding ? (
            <AddItemForm
              key={`${category}-add`}
              category={category}
              onAdded={handleAdded}
              onCancel={() => setAdding(false)}
            />
          ) : selectedKey ? (
            <ItemEditor
              key={`${category}-${selectedKey}`}
              category={category}
              itemKey={selectedKey}
              onSaved={handleSaved}
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
