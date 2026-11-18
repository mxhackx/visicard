"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { parseMenuModel, serializeMenuModel, type MenuModel } from "@/lib/menu-lines";

/* Formulaire de menu : accroche, étiquettes, catégories et plats avec prix. Il écrit le même texte que l'ancien champ libre. */

const EMPTY_SECTION = { title: "", dishes: [{ name: "", price: "" }] };

export default function MenuEditor({
  value,
  onChange,
  max,
  tagsPlaceholder,
}: {
  value: string;
  onChange: (next: string) => void;
  max: number;
  tagsPlaceholder?: string;
}) {
  const [model, setModel] = useState<MenuModel>(() => {
    const m = parseMenuModel(value);
    return m.sections.length ? m : { ...m, sections: [{ ...EMPTY_SECTION, title: "Entrées", dishes: [{ name: "", price: "" }] }] };
  });
  const [seen, setSeen] = useState(value);
  const [version, setVersion] = useState(0);

  // Texte modifié depuis l'extérieur (modèle inséré, brouillon restauré) : on relit.
  if (value !== seen) {
    setSeen(value);
    if (value !== serializeMenuModel(model)) {
      const m = parseMenuModel(value);
      setModel(m.sections.length ? m : { ...m, sections: [{ title: "Entrées", dishes: [{ name: "", price: "" }] }] });
      setVersion((v) => v + 1);
    }
  }

  const commit = (next: MenuModel) => {
    setModel(next);
    const text = serializeMenuModel(next);
    setSeen(text);
    onChange(text);
  };
  const setSection = (i: number, patch: Partial<MenuModel["sections"][number]>) =>
    commit({ ...model, sections: model.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setDish = (i: number, k: number, patch: Partial<{ name: string; price: string }>) =>
    setSection(i, { dishes: model.sections[i].dishes.map((d, j) => (j === k ? { ...d, ...patch } : d)) });

  const used = serializeMenuModel(model).length;
  const box = "rounded-2xl border border-line bg-white p-3.5 sm:p-4";
  const label = "mb-1 block text-xs font-semibold text-ink/70";

  return (
    <div className="space-y-4">
      <div>
        <label className={label} htmlFor="menu-tagline">Accroche</label>
        <input id="menu-tagline" className="field" value={model.tagline} maxLength={120} placeholder="Cuisine béninoise et grillades" onChange={(e) => commit({ ...model, tagline: e.target.value })} />
      </div>
      <div>
        <label className={label} htmlFor="menu-tags">Atouts <span className="font-normal text-sage">(séparés par une virgule)</span></label>
        <input
          id="menu-tags"
          key={version}
          className="field"
          defaultValue={model.tags.join(", ")}
          placeholder={tagsPlaceholder ?? "wifi, terrasse, climatisé, livraison"}
          onChange={(e) => commit({ ...model, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
        />
      </div>

      {model.sections.map((s, i) => (
        <section key={i} className={box} aria-label={`Catégorie ${i + 1}`}>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className={label} htmlFor={`menu-cat-${i}`}>Catégorie</label>
              <input id={`menu-cat-${i}`} className="field font-semibold" value={s.title} maxLength={40} placeholder="Plats principaux" onChange={(e) => setSection(i, { title: e.target.value })} />
            </div>
            {model.sections.length > 1 && (
              <button type="button" aria-label={`Supprimer la catégorie ${s.title || i + 1}`} onClick={() => commit({ ...model, sections: model.sections.filter((_, j) => j !== i) })} className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink/50 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <ul className="mt-3 space-y-2">
            {s.dishes.map((d, k) => (
              <li key={k} className="flex items-center gap-2">
                <input aria-label="Nom du plat" className="field min-w-0 flex-1" value={d.name} maxLength={60} placeholder="Poulet braisé" onChange={(e) => setDish(i, k, { name: e.target.value })} />
                <div className="relative w-28 shrink-0 sm:w-32">
                  <input aria-label="Prix en FCFA" inputMode="numeric" className="field pr-12 text-right" value={d.price ? Number(d.price.replace(/\D/g, "")).toLocaleString("fr-FR") : ""} placeholder="2 500" onChange={(e) => setDish(i, k, { price: e.target.value.replace(/\D/g, "").slice(0, 7) })} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-sage">FCFA</span>
                </div>
                <button type="button" aria-label="Supprimer ce plat" onClick={() => setSection(i, { dishes: s.dishes.length > 1 ? s.dishes.filter((_, j) => j !== k) : [{ name: "", price: "" }] })} className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-ink/40 transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setSection(i, { dishes: [...s.dishes, { name: "", price: "" }] })} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
            <Plus className="h-4 w-4" /> Ajouter un plat
          </button>
        </section>
      ))}

      <button type="button" onClick={() => commit({ ...model, sections: [...model.sections, { title: "", dishes: [{ name: "", price: "" }] }] })} className="btn btn-outline btn-sm w-full">
        <Plus className="h-4 w-4" /> Ajouter une catégorie
      </button>
      <p className="text-xs text-sage">Un plat est enregistré quand son nom et son prix sont remplis. {used} / {max} caractères</p>
    </div>
  );
}
