"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Save, ArrowLeft } from "lucide-react";

interface CivGuide {
  leaderId: number;
  leader: string;
  civilization: string;
  habilidadeCiv: string;
  habilidadeLider: string;
  unidadeUnica: string;
  infraUnica: string;
  playstyle: string;
  vitoriaIdeal: string;
}

const FIELDS: { key: keyof CivGuide; label: string; multiline?: boolean }[] = [
  { key: "habilidadeCiv",    label: "Habilidade da Civilização", multiline: true },
  { key: "habilidadeLider",  label: "Habilidade do Líder",       multiline: true },
  { key: "unidadeUnica",     label: "Unidade Única" },
  { key: "infraUnica",       label: "Infraestrutura Única",      multiline: true },
  { key: "playstyle",        label: "Estilo de Jogo",            multiline: true },
  { key: "vitoriaIdeal",     label: "Vitória Ideal" },
];

export default function EditCivGuidesPage() {
  const [guides, setGuides] = useState<CivGuide[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/civ-guides")
      .then((r) => r.json())
      .then((data) => setGuides(data.guides));
  }, []);

  const update = useCallback((leaderId: number, key: keyof CivGuide, value: string) => {
    setGuides((prev) =>
      prev.map((g) => (g.leaderId === leaderId ? { ...g, [key]: value } : g))
    );
    setSaved(false);
  }, []);

  const saveAll = async () => {
    setSaving(true);
    await fetch("/api/civ-guides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guides }),
    });
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="relative isolate min-h-[100dvh]">
      <div className="page-ornament" aria-hidden />
      <div className="grain-overlay" aria-hidden />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/civilizacoes"
              className="inline-flex items-center gap-1.5 text-sm text-[rgb(216_183_108_/_0.7)] hover:text-[rgb(240_210_140_/_0.9)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1
              className="text-xl font-semibold tracking-wide text-[rgb(240_215_150_/_0.95)]"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              Editar Guias
            </h1>
          </div>

          <button
            onClick={saveAll}
            disabled={saving}
            className="game-control-button flex items-center gap-2 px-4 w-auto"
            style={{ width: "auto", padding: "0 1rem" }}
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar tudo"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {guides.map((guide) => (
            <div
              key={guide.leaderId}
              className="rounded-xl border border-[rgb(212_171_86_/_0.28)] bg-[rgb(11_26_46_/_0.82)] overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[rgb(255_255_255_/_0.03)] transition-colors"
                onClick={() => setOpen((prev) => (prev === guide.leaderId ? null : guide.leaderId))}
              >
                <div>
                  <span className="text-[rgb(240_215_150_/_0.95)] font-semibold text-sm" style={{ fontFamily: "var(--font-cinzel)" }}>
                    {guide.civilization}
                  </span>
                  <span className="ml-2 text-xs text-[rgb(200_175_120_/_0.65)]">
                    {guide.leader}
                  </span>
                </div>
                {open === guide.leaderId
                  ? <ChevronUp className="h-4 w-4 text-[rgb(216_183_108_/_0.6)] shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-[rgb(216_183_108_/_0.6)] shrink-0" />
                }
              </button>

              {open === guide.leaderId && (
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[rgb(212_171_86_/_0.15)]">
                  {FIELDS.map(({ key, label, multiline }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[rgb(200_175_120_/_0.7)]">
                        {label}
                      </label>
                      {multiline ? (
                        <textarea
                          rows={2}
                          value={guide[key] as string}
                          onChange={(e) => update(guide.leaderId, key, e.target.value)}
                          className="game-text-input w-full resize-y px-3 py-2 text-sm leading-relaxed"
                          style={{ minHeight: "3rem" }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={guide[key] as string}
                          onChange={(e) => update(guide.leaderId, key, e.target.value)}
                          className="game-text-input h-9 w-full px-3 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={saveAll}
            disabled={saving}
            className="game-control-button flex items-center gap-2"
            style={{ width: "auto", padding: "0 1.25rem" }}
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar tudo"}
          </button>
        </div>
      </div>
    </div>
  );
}
