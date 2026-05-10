'use client';

import { useEffect, useRef, useState } from 'react';
import { ConfigCategory, ConfigStore, ItemConfig } from '@/lib/civ/ConfigStore';
import { Terrain, Feature, Resource, DistrictType, WonderType, TERRAIN_LABEL, TERRAIN_COLORS, FEATURE_LABEL, FEATURE_COLOR, RESOURCE_LABEL, RESOURCE_COLOR } from '@/lib/civ/types';
import { DISTRICT_META } from '@/lib/civ/District';
import { WONDER_DATA } from '@/lib/civ/Wonder';
import { TERRAIN_BASE, FEATURE_BASE, RESOURCE_BASE } from '@/lib/civ/HexTile';
import { Stats } from '@/lib/civ/Stats';

type YieldsKey = keyof NonNullable<ItemConfig['yields']>;
const FLOAT_YIELDS: YieldsKey[] = ['food', 'production', 'science', 'gold', 'culture', 'faith'];
const INT_YIELDS: YieldsKey[] = ['housing', 'amenities', 'appeal'];
const ALL_YIELDS: YieldsKey[] = [...FLOAT_YIELDS, ...INT_YIELDS];
const YIELD_LABEL: Record<YieldsKey, string> = {
  food: 'Comida', production: 'Produção', science: 'Ciência',
  gold: 'Ouro', culture: 'Cultura', faith: 'Fé',
  housing: 'Moradia', amenities: 'Comodidade', appeal: 'Atratividade',
};

function getDefaults(cat: ConfigCategory, key: string): { label: string; color: string; stats: Stats } {
  switch (cat) {
    case 'terrain': return { label: TERRAIN_LABEL[key as Terrain], color: TERRAIN_COLORS[key as Terrain], stats: TERRAIN_BASE[key as Terrain] };
    case 'feature': return { label: FEATURE_LABEL[key as Feature], color: FEATURE_COLOR[key as Feature], stats: FEATURE_BASE[key as Feature] };
    case 'resource': return { label: RESOURCE_LABEL[key as Resource], color: RESOURCE_COLOR[key as Resource], stats: RESOURCE_BASE[key as Resource] };
    case 'district': return { label: DISTRICT_META[key as DistrictType].name, color: DISTRICT_META[key as DistrictType].color, stats: Stats.zero() };
    case 'wonder': return { label: WONDER_DATA[key as WonderType].name, color: WONDER_DATA[key as WonderType].color, stats: WONDER_DATA[key as WonderType].effect };
  }
}

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

export function ItemEditor({ category, itemKey, onSaved }: Props) {
  const defaults = getDefaults(category, itemKey);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => loadForm(category, itemKey));

  function loadForm(cat: ConfigCategory, key: string): FormState {
    const cfg = ConfigStore.getItem(cat, key);
    return {
      label: cfg.label ?? '',
      color: cfg.color ?? '',
      icon:  cfg.icon  ?? '',
      yields: ALL_YIELDS.reduce((acc, k) => {
        acc[k] = cfg.yields?.[k] !== undefined ? String(cfg.yields[k]) : '';
        return acc;
      }, {} as Partial<Record<YieldsKey, string>>),
    };
  }

  useEffect(() => {
    setForm(loadForm(category, itemKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, itemKey]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = () => {
    const patch: Partial<ItemConfig> = {};
    if (form.label.trim()) patch.label = form.label.trim();
    if (form.color.trim()) patch.color = form.color.trim();
    if (form.icon.trim()) patch.icon = form.icon.trim();

    const yields: ItemConfig['yields'] = {};
    let hasYield = false;
    for (const k of ALL_YIELDS) {
      const v = form.yields[k];
      if (v !== undefined && v !== '') {
        const n = parseFloat(v);
        if (!isNaN(n)) { (yields as Record<string, number>)[k] = n; hasYield = true; }
      }
    }
    if (hasYield) patch.yields = yields;

    ConfigStore.setItem(category, itemKey, patch);
    showToast('Salvo');
    onSaved();
  };

  const handleReset = () => {
    ConfigStore.resetItem(category, itemKey);
    setForm(loadForm(category, itemKey));
    showToast('Resetado');
    onSaved();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setForm(f => ({ ...f, icon: result }));
    };
    reader.readAsDataURL(file);
  };

  const activeColor = form.color || defaults.color;

  return (
    <div className="flex flex-col gap-4 text-sm text-[var(--civ-gold-100)]">
      {toast && (
        <div className="fixed top-4 right-4 bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)] font-bold px-4 py-2 rounded shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      {/* Label */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Label</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          placeholder={defaults.label}
          className="bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] placeholder:text-[var(--civ-gold-300)]/40 focus:outline-none focus:border-[var(--civ-gold-500)]"
        />
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Cor</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={activeColor}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className="w-8 h-8 rounded cursor-pointer border border-[var(--civ-gold-500)]/30"
          />
          <input
            type="text"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            placeholder={defaults.color}
            className="flex-1 bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] placeholder:text-[var(--civ-gold-300)]/40 focus:outline-none focus:border-[var(--civ-gold-500)]"
          />
          {form.color && (
            <button onClick={() => setForm(f => ({ ...f, color: '' }))} className="text-[var(--civ-gold-300)]/50 hover:text-[var(--civ-gold-300)] text-xs">✕</button>
          )}
        </div>
      </div>

      {/* Icon */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--civ-gold-300)]/70">Ícone (arquivo ou emoji)</label>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-2 py-1 rounded border border-[var(--civ-gold-500)]/30 text-xs text-[var(--civ-gold-300)] hover:bg-[var(--civ-gold-500)]/20 transition-colors"
          >
            Enviar arquivo
          </button>
          <input
            type="text"
            value={form.icon.startsWith('data:') ? '' : form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder="emoji"
            maxLength={2}
            className="w-16 bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-1 text-sm text-[var(--civ-gold-100)] placeholder:text-[var(--civ-gold-300)]/40 focus:outline-none focus:border-[var(--civ-gold-500)]"
          />
          {form.icon && (
            <>
              {form.icon.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.icon} alt="preview" className="w-8 h-8 rounded object-cover border border-[var(--civ-gold-500)]/30" />
              ) : (
                <span className="text-2xl">{form.icon}</span>
              )}
              <button onClick={() => setForm(f => ({ ...f, icon: '' }))} className="text-[var(--civ-gold-300)]/50 hover:text-[var(--civ-gold-300)] text-xs">✕</button>
            </>
          )}
        </div>
      </div>

      {/* Yields */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[var(--civ-gold-300)]/70">
          Yields {category === 'district' ? '(adicional ao bônus de adjacência)' : '(vazio = padrão)'}
        </label>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {ALL_YIELDS.map(k => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[var(--civ-gold-300)]/60 text-xs w-20 shrink-0">{YIELD_LABEL[k]}</span>
              <input
                type="number"
                step={INT_YIELDS.includes(k) ? 1 : 0.5}
                value={form.yields[k] ?? ''}
                onChange={e => setForm(f => ({ ...f, yields: { ...f.yields, [k]: e.target.value } }))}
                placeholder={String(defaults.stats[k as keyof Stats] ?? 0)}
                className="w-full bg-[var(--civ-blue-950)] border border-[var(--civ-gold-500)]/30 rounded px-2 py-0.5 text-xs text-[var(--civ-gold-100)] placeholder:text-[var(--civ-gold-300)]/30 focus:outline-none focus:border-[var(--civ-gold-500)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-[var(--civ-gold-500)]/20">
        <button
          onClick={handleSave}
          className="flex-1 py-1.5 rounded bg-[var(--civ-gold-500)] text-[var(--civ-blue-950)] font-bold text-sm hover:bg-[var(--civ-gold-400)] transition-colors"
        >
          Salvar
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 rounded border border-[var(--civ-gold-500)]/30 text-[var(--civ-gold-300)] text-sm hover:bg-[var(--civ-gold-500)]/20 transition-colors"
        >
          Resetar
        </button>
      </div>
    </div>
  );
}
