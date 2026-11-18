/**
 * Menu d'un établissement, stocké dans le champ « informations » (une ligne par élément) :
 *   accroche
 *   étiquette (wifi, terrasse…)
 *   Catégorie
 *   Nom du plat : 1500
 * Le formulaire de menu (menu-editor) écrit ce format, et les styles de page le lisent : il reste du simple texte.
 */

const PRICE = /^(.*?)[\s:–—-]+(\d[\d\s.]*\d|\d)\s*(?:f\s?cfa|cfa|xof|f)?\s*$/i;

export interface Dish { name: string; price: string }
export interface MenuSection { title: string; dishes: Dish[] }
export interface MenuModel { tagline: string; tags: string[]; sections: MenuSection[] }

const pricedLine = (line?: string) => {
  const m = (line ?? "").match(PRICE);
  return m && m[1].trim() ? { name: m[1].trim(), price: m[2].replace(/\D/g, "") } : null;
};

export function parseMenuModel(text: string): MenuModel {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const model: MenuModel = { tagline: "", tags: [], sections: [] };
  lines.forEach((line, i) => {
    const dish = pricedLine(line);
    if (dish) {
      if (!model.sections.length) model.sections.push({ title: "Menu", dishes: [] });
      model.sections[model.sections.length - 1].dishes.push(dish);
    } else if (pricedLine(lines[i + 1])) {
      model.sections.push({ title: line, dishes: [] });
    } else if (i === 0) {
      model.tagline = line;
    } else {
      model.tags.push(line);
    }
  });
  return model;
}

export function serializeMenuModel(m: MenuModel): string {
  const out: string[] = [];
  if (m.tagline.trim()) out.push(m.tagline.trim());
  m.tags.map((t) => t.trim()).filter(Boolean).forEach((t) => out.push(t));
  m.sections.forEach((s) => {
    // Un plat sans nom ou sans prix reste dans le formulaire mais n'est pas enregistré (il se lirait comme une catégorie).
    const dishes = s.dishes.filter((d) => d.name.trim() && d.price.replace(/\D/g, ""));
    if (!dishes.length) return;
    out.push(s.title.trim() || "Menu");
    dishes.forEach((d) => out.push(`${d.name.trim()} : ${d.price.replace(/\D/g, "")}`));
  });
  return out.join("\n");
}

/** Formate un prix en francs CFA : 1500 → « 1 500 FCFA ». */
export const formatFcfa = (digits: string) => `${Number(digits.replace(/\D/g, "")).toLocaleString("fr-FR")} FCFA`;
