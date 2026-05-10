'use client';

import { useRef, useState } from 'react';
import { ConfigCategory, ConfigStore } from '@/lib/civ/ConfigStore';

type YieldsKey = 'food' | 'production' | 'science' | 'gold' | 'culture' | 'faith' | 'housing' | 'amenities' | 'appeal';
const ALL_YIELDS: YieldsKey[] = ['food', 'production', 'science', 'gold', 'culture', 'faith', 'housing', 'amenities', 'appeal'];
const YIELD_LABEL: Record<YieldsKey, string> = {
  food: 'Comida', production: 'Produção', science: 'Ciência',
  gold: 'Ouro', culture: 'Cultura', faith: 'Fé',
  housing: 'Moradia', amenities: 'Comodidade', appeal: 'Atratividade',
};

interface Props {
  category: ConfigCategory;
  onAdded: (key: string) => void;
  onCancel: () => void;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 32) || 'custom';
}

export function AddItemForm({ category, onAdded, onCancel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#888888');
  const [icon, setIcon] = useState('');
  const [yields, setYields] = useState<Partial<Record<YieldsKey, string>>>({});
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setIcon(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!label.trim()) { setError('Label obrigatório'); return; }
    const baseKey = slugify(label);
    const existingKeys = new Set(ConfigStore.getList(category).map(i => i.key));
    let key = `custom_${baseKey}`;
    let n = 1;
    while (existingKeys.has(key)) key = `custom_${baseKey}_${n++}`;

    const parsedYields: Record<string, number> = {};
    for (const k of ALL_YIELDS) {
      const v = yields[k];
      if (v !== undefined && v !== '') {
        const n = parseFloat(v);
        if (!isNaN(n)) parsedYields[k] = n;
      }
    }

    ConfigStore.addCustomItem(category, {
      key, label: label.trim(), color, icon: icon || undefined, yields: parsedYields, enabled: true,
    });
    onAdded(key);
  };

  return (
    <div className="flex flex-col gap-4 text-sm text-[var(--civ-gold-100)]">
      <h2 className="text-[var(--civ-gold-400)] font-semibold text-sm">Novo item</h2>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Label *</label>
        <input
          type="text" value={label} autoFocus
          onChange={e => { setLabel(e.target.value); setError(''); }}
          className="bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] focus:outline-none focus:border-[var(--civ-gold-500)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Cor</label>
        <div className="flex items-center gap-2">
          <input type="color" value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-[var(--civ-gold-500)]/30"
          />
          <input type="text" value={color}
            onChange={e => setColor(e.target.value)}
            className="flex-1 bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] focus:outline-none focus:border-[var(--civ-gold-500)]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Ícone (arquivo ou emoji)</label>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileRef.current?.click()}
            className="px-2 py-1 rounded border border-[var(--civ-gold-500)]/30 text-xs text-[var(--civ-gold-300)] hover:bg-[var(--civ-gold-500)]/20 transition-colors">
            Enviar arquivo
          </button>
          <input type="text" value={icon.startsWith('data:') ? '' : icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="emoji" maxLength={2}
            className="w-16 bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] focus:outline-none focus:border-[var(--civ-gold-500)]"
          />
          {icon && (
            <>
              {icon.startsWith('data:')
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={icon} alt="preview" className="w-8 h-8 rounded object-cover border border-[var(--civ-gold-500)]/30" />
                : <span className="text-2xl">{icon}</span>}
              <button onClick={() => setIcon('')}
                className="text-[var(--civ-gold-300)]/50 hover:text-[var(--civ-gold-300)] text-xs">✕</button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Yields</label>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {ALL_YIELDS.map(k => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[var(--civ-gold-300)]/60 text-xs w-20 shrink-0">{YIELD_LABEL[k]}</span>
              <input type="number" step={['housing', 'amenities', 'appeal'].includes(k) ? 1 : 0.5}
                value={yields[k] ?? ''}
                onChange={e => setYields(y => ({ ...y, [k]: e.target.value }))}
                placeholder="0"
                className="w-full bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-0.5 text-xs text-[var(--civ-gold-100)] placeholder:text-[var(--civ-gold-300)]/30 focus:outline-none focus:border-[var(--civ-gold-500)]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-[var(--civ-gold-500)]/20">
        <button onClick={handleAdd}
          className="flex-1 py-1.5 rounded bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)] font-bold text-sm hover:bg-[var(--civ-gold-400)] transition-colors">
          Adicionar
        </button>
        <button onClick={onCancel}
          className="px-4 py-1.5 rounded border border-[var(--civ-gold-500)]/30 text-[var(--civ-gold-300)] text-sm hover:bg-[var(--civ-gold-500)]/20 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}
