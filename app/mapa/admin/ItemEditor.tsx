'use client';

import { useEffect, useRef, useState } from 'react';
import { ConfigCategory, ConfigItem, ConfigStore } from '@/lib/civ/ConfigStore';
import { ensureSeeded, getDefaultItems } from '@/lib/civ/defaultItems';

type YieldsKey = keyof NonNullable<ConfigItem['yields']>;
const FLOAT_YIELDS: YieldsKey[] = ['food', 'production', 'science', 'gold', 'culture', 'faith'];
const INT_YIELDS: YieldsKey[] = ['housing', 'amenities', 'appeal'];
const ALL_YIELDS: YieldsKey[] = [...FLOAT_YIELDS, ...INT_YIELDS];
const YIELD_LABEL: Record<YieldsKey, string> = {
  food: 'Comida', production: 'Produção', science: 'Ciência',
  gold: 'Ouro', culture: 'Cultura', faith: 'Fé',
  housing: 'Moradia', amenities: 'Comodidade', appeal: 'Atratividade',
};

interface FormState {
  label: string;
  color: string;
  icon: string;
  yields: Partial<Record<YieldsKey, string>>;
}

interface Props {
  category: ConfigCategory;
  itemKey: string;
  onSaved: () => void;
}

function getDefaultYield(cat: ConfigCategory, key: string, field: YieldsKey): number {
  const defaults = getDefaultItems(cat);
  const item = defaults.find(i => i.key === key);
  return (item?.yields as Record<string, number>)?.[field] ?? 0;
}

function loadForm(cat: ConfigCategory, key: string): FormState {
  const list = ensureSeeded(cat);
  const item = list.find(i => i.key === key);
  if (!item) return { label: '', color: '', icon: '', yields: {} };
  return {
    label: item.label,
    color: item.color,
    icon:  item.icon ?? '',
    yields: ALL_YIELDS.reduce((acc, k) => {
      acc[k] = String((item.yields as Record<string, number>)[k] ?? '');
      return acc;
    }, {} as Partial<Record<YieldsKey, string>>),
  };
}

export function ItemEditor({ category, itemKey, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => loadForm(category, itemKey));

  useEffect(() => {
    setForm(loadForm(category, itemKey));
  }, [category, itemKey]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = () => {
    const yields: ConfigItem['yields'] = {};
    for (const k of ALL_YIELDS) {
      const v = form.yields[k];
      if (v !== undefined && v !== '') {
        const n = parseFloat(v);
        if (!isNaN(n)) (yields as Record<string, number>)[k] = n;
      }
    }
    ConfigStore.updateItem(category, itemKey, {
      label: form.label || undefined,
      color: form.color || undefined,
      icon:  form.icon  || undefined,
      yields,
    });
    onSaved();
    showToast('Salvo');
  };

  const handleReset = () => {
    const defaults = getDefaultItems(category);
    const def = defaults.find(i => i.key === itemKey);
    if (def) {
      ConfigStore.updateItem(category, itemKey, {
        label: def.label, color: def.color, icon: undefined, yields: def.yields,
      });
    }
    setForm(loadForm(category, itemKey));
    onSaved();
    showToast('Resetado');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, icon: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4 text-sm text-[var(--civ-gold-100)]">
      {toast && (
        <div className="fixed top-4 right-4 bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)] font-bold px-4 py-2 rounded shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Label</label>
        <input type="text" value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          className="bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] focus:outline-none focus:border-[var(--civ-gold-500)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Cor</label>
        <div className="flex items-center gap-2">
          <input type="color" value={form.color || '#888888'}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className="w-8 h-8 rounded cursor-pointer border border-[var(--civ-gold-500)]/30"
          />
          <input type="text" value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
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
          <input type="text" value={form.icon.startsWith('data:') ? '' : form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="emoji" maxLength={2}
            className="w-16 bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] focus:outline-none focus:border-[var(--civ-gold-500)]"
          />
          {form.icon && (
            <>
              {form.icon.startsWith('data:')
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={form.icon} alt="preview" className="w-8 h-8 rounded object-cover border border-[var(--civ-gold-500)]/30" />
                : <span className="text-2xl">{form.icon}</span>}
              <button onClick={() => setForm(f => ({ ...f, icon: '' }))}
                className="text-[var(--civ-gold-300)]/50 hover:text-[var(--civ-gold-300)] text-xs">✕</button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-[var(--civ-gold-300)]/70">
          Yields {category === 'district' ? '(adicional ao bônus de adjacência)' : ''}
        </label>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {ALL_YIELDS.map(k => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[var(--civ-gold-300)]/60 text-xs w-20 shrink-0">{YIELD_LABEL[k]}</span>
              <input type="number" step={INT_YIELDS.includes(k) ? 1 : 0.5}
                value={form.yields[k] ?? ''}
                onChange={e => setForm(f => ({ ...f, yields: { ...f.yields, [k]: e.target.value } }))}
                placeholder={String(getDefaultYield(category, itemKey, k))}
                className="w-full bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-0.5 text-xs text-[var(--civ-gold-100)] placeholder:text-[var(--civ-gold-300)]/30 focus:outline-none focus:border-[var(--civ-gold-500)]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-[var(--civ-gold-500)]/20">
        <button onClick={handleSave}
          className="flex-1 py-1.5 rounded bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)] font-bold text-sm hover:bg-[var(--civ-gold-400)] transition-colors">
          Salvar
        </button>
        <button onClick={handleReset}
          className="px-4 py-1.5 rounded border border-[var(--civ-gold-500)]/30 text-[var(--civ-gold-300)] text-sm hover:bg-[var(--civ-gold-500)]/20 transition-colors">
          Resetar
        </button>
      </div>
    </div>
  );
}
