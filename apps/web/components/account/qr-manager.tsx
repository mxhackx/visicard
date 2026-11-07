"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, CalendarCheck, Check, Circle, Clock, ExternalLink, ImagePlus, Loader2, MessageCircle, Plus, QrCode, Save, Settings2, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { BarChart, MeterList } from "@/components/admin/charts";
import { analytics, addEstablishment, liveState, myEstablishments, saveLive, uploadProductImage, type Analytics, type Catalog, type Establishment, type LiveState, type RequestMode, type Schedule } from "@/lib/business";
import { useAccountToken } from "./use-account";
import AccountNav from "./account-nav";

const DEVICE: Record<string, string> = { android: "Android", ios: "iPhone / iPad", desktop: "Ordinateur", other: "Autre" };
const DAYS = [["monday", "Lundi"], ["tuesday", "Mardi"], ["wednesday", "Mercredi"], ["thursday", "Jeudi"], ["friday", "Vendredi"], ["saturday", "Samedi"], ["sunday", "Dimanche"]] as const;
const MODES: { id: RequestMode; label: string; hint: string; icon: typeof Settings2 }[] = [
  { id: "none", label: "Aucune", hint: "La page s’affiche seulement.", icon: Settings2 },
  { id: "contact", label: "Messages", hint: "Le visiteur vous écrit.", icon: MessageCircle },
  { id: "booking", label: "Réservations", hint: "Date, heure, nombre de personnes.", icon: CalendarCheck },
  { id: "order", label: "Commandes", hint: "Il choisit dans votre catalogue.", icon: ShoppingBag },
];
const defaultSchedule = (): Schedule => Object.fromEntries(DAYS.map(([d]) => [d, { isOpen: d !== "sunday", open: "09:00", close: "19:00" }]));

type Tab = "stats" | "catalogue" | "reglages";

/** Page de gestion d'un QR code : statistiques, catalogue et promotions, réglages (sans devis de modification). */
export default function QrManager({ slug }: { slug: string }) {
  const token = useAccountToken(`/compte/qr/${slug}`);
  const [tab, setTab] = useState<Tab>("stats");
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Analytics | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
  const [ests, setEsts] = useState<Establishment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    Promise.all([liveState(token, slug), myEstablishments(token)])
      .then(([l, e]) => alive && (setLive({ ...l, schedule: l.schedule ?? defaultSchedule() }), setEsts(e)))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [token, slug]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    analytics(token, slug, days)
      .then((a) => alive && setStats(a))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Statistiques indisponibles."));
    return () => {
      alive = false;
    };
  }, [token, slug, days]);

  const persist = useCallback(
    async (body: Parameters<typeof saveLive>[2], label: string) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      setSaved(null);
      try {
        const next = await saveLive(token, slug, body);
        setLive({ ...next, schedule: next.schedule ?? defaultSchedule() });
        setSaved(label);
        window.setTimeout(() => setSaved(null), 2500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      } finally {
        setBusy(false);
      }
    },
    [token, slug],
  );

  const catalog: Catalog = live?.catalog ?? { promo: null, products: [] };
  const setCatalog = (c: Catalog) => live && setLive({ ...live, catalog: c });
  const isPage = live?.serviceType === "page";

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-sm font-medium text-sage">Gestion du QR code</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">{live?.title ?? stats?.title ?? "…"}</h1>
        <div className="flex flex-wrap gap-2">
          {live?.orderReference && <Link href={`/commande/${live.orderReference}`} className="btn btn-outline btn-sm"><QrCode className="h-4 w-4" /> QR code et facture</Link>}
          <Link href={`/c/${slug}`} target="_blank" className="btn btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> Voir la page</Link>
        </div>
      </div>
      <div className="mt-6"><AccountNav /></div>

      {live && isPage && (() => {
        const steps: [boolean, string, Tab][] = [
          [live.catalog.products.length > 0, "Ajoutez vos produits ou services", "catalogue"],
          [live.requestMode !== "none", "Activez les réservations, commandes ou messages", "reglages"],
          [(stats?.total ?? 0) > 0, "Partagez ou imprimez votre QR code : le premier scan apparaît ici", "stats"],
        ];
        if (steps.every(([ok]) => ok)) return null;
        return (
          <div className="mt-6 rounded-2xl border border-line bg-white p-4 sm:p-5">
            <p className="text-sm font-semibold text-ink">Pour bien démarrer</p>
            <ul className="mt-3 space-y-2">
              {steps.map(([ok, label, t]) => (
                <li key={label}>
                  <button type="button" onClick={() => setTab(t)} className="flex w-full items-center gap-2.5 text-left text-sm text-ink/80 hover:text-ink">
                    {ok ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-line" />}
                    <span className={ok ? "line-through opacity-60" : ""}>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      <div className="mt-6 inline-flex rounded-xl border border-line bg-white p-1" role="tablist">
        {([["stats", "Statistiques", BarChart3], ["catalogue", "Catalogue & promo", Tag], ["reglages", "Réglages", Settings2]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === id ? "bg-forest text-white" : "text-ink/70 hover:text-ink"}`}>
            <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {saved && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{saved}</p>}

      {tab === "stats" && (
        <div className="mt-6 space-y-5">
          {!stats ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-forest" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                  {([["Scans (total)", stats.total], [`Scans (${days} j)`, stats.inPeriod], ["Heure de pointe", stats.peakHour === null ? "—" : `${stats.peakHour} h`], ["Demandes", stats.requests.total]] as const).map(([l, v]) => (
                    <div key={l} className="surface p-4 text-center"><p className="text-2xl font-semibold text-forest">{typeof v === "number" ? new Intl.NumberFormat("fr-FR").format(v) : v}</p><p className="mt-1 text-xs text-sage">{l}</p></div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {[7, 30, 90].map((d) => <button key={d} type="button" onClick={() => setDays(d)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${days === d ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/75"}`}>{d} jours</button>)}
              </div>
              <div className="surface p-5">
                <h2 className="text-sm font-semibold text-ink/80">Scans par jour</h2>
                <div className="mt-4"><BarChart ariaLabel="Scans par jour" height={150} labelEvery={days > 30 ? 14 : days > 7 ? 5 : 1} data={stats.days.map((d) => ({ label: d.date.slice(8), title: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(d.date)), value: d.count, display: `${d.count} scan${d.count > 1 ? "s" : ""}` }))} /></div>
              </div>
              <div className="surface p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink/80"><Clock className="h-4 w-4" /> Heures de consultation <span className="font-normal text-sage">(heure du Bénin)</span></h2>
                <div className="mt-4"><BarChart ariaLabel="Scans par heure" height={130} labelEvery={3} data={stats.hours.map((h) => ({ label: `${h.hour}h`, title: `${h.hour} h – ${h.hour + 1} h`, value: h.count, display: `${h.count} scan${h.count > 1 ? "s" : ""}` }))} /></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="surface p-5"><h2 className="mb-4 text-sm font-semibold text-ink/80">Appareils</h2><MeterList items={stats.devices.map((d) => ({ label: DEVICE[d.label] ?? d.label, value: d.count }))} /></div>
                <div className="surface p-5"><h2 className="mb-4 text-sm font-semibold text-ink/80">Localisation approximative</h2><MeterList items={(stats.cities.length ? stats.cities : stats.countries).map((d) => ({ label: d.label, value: d.count }))} /></div>
              </div>
              {stats.requests.total > 0 && (
                <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-sage">
                  {stats.requests.total} demande{stats.requests.total > 1 ? "s" : ""} reçue{stats.requests.total > 1 ? "s" : ""} sur la période ({stats.requests.order ?? 0} commande(s), {stats.requests.booking ?? 0} réservation(s), {stats.requests.contact ?? 0} message(s)) — soit <strong className="text-ink">{stats.conversion} %</strong> des scans.
                </p>
              )}
              <p className="text-xs text-sage">La localisation est approximative (pays, parfois ville) et aucune adresse IP n’est conservée.</p>
            </>
          )}
        </div>
      )}

      {tab === "catalogue" && live && (
        <div className="mt-6 space-y-5">
          {!isPage ? (
            <p className="surface p-5 text-sm text-sage">Le catalogue et les promotions sont disponibles pour les pages digitales.</p>
          ) : (
            <>
              <div className="surface p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Tag className="h-4 w-4 text-forest" /> Promotion</h2>
                <p className="mt-1 text-sm text-sage">Un bandeau en haut de votre page. Il disparaît seul à la date de fin.</p>
                <div className="mt-4 grid gap-3">
                  <input className="field" placeholder="Titre : -20 % ce week-end" maxLength={80} value={catalog.promo?.title ?? ""} onChange={(e) => setCatalog({ ...catalog, promo: { title: e.target.value, text: catalog.promo?.text ?? "", until: catalog.promo?.until ?? null } })} />
                  <textarea className="field min-h-16" placeholder="Détails (facultatif)" maxLength={300} value={catalog.promo?.text ?? ""} onChange={(e) => setCatalog({ ...catalog, promo: { title: catalog.promo?.title ?? "", text: e.target.value, until: catalog.promo?.until ?? null } })} />
                  <label className="flex items-center gap-3 text-sm text-ink/80">Jusqu’au <input type="date" className="field max-w-48" value={catalog.promo?.until ?? ""} onChange={(e) => setCatalog({ ...catalog, promo: { title: catalog.promo?.title ?? "", text: catalog.promo?.text ?? "", until: e.target.value || null } })} /></label>
                </div>
              </div>

              <div className="surface p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><ShoppingBag className="h-4 w-4 text-forest" /> Catalogue de produits</h2>
                <p className="mt-1 text-sm text-sage">Menu du jour, plats, articles, services : modifiez-les quand vous voulez, sans devis.</p>
                <ul className="mt-4 space-y-3">
                  {catalog.products.map((p, i) => (
                    <li key={p.id ?? i} className="rounded-xl border border-line p-3">
                      <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                        <input className="field" placeholder="Nom" maxLength={80} value={p.name} onChange={(e) => setCatalog({ ...catalog, products: catalog.products.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
                        <input className="field" inputMode="numeric" placeholder="Prix FCFA" value={p.price ?? ""} onChange={(e) => setCatalog({ ...catalog, products: catalog.products.map((x, k) => (k === i ? { ...x, price: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) } : x)) })} />
                        <button type="button" aria-label="Supprimer" onClick={() => setCatalog({ ...catalog, products: catalog.products.filter((_, k) => k !== i) })} className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-sage hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <input className="field mt-2" placeholder="Description (facultatif)" maxLength={200} value={p.description} onChange={(e) => setCatalog({ ...catalog, products: catalog.products.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)) })} />
                      <div className="mt-2 flex items-center gap-3">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        )}
                        <label className="btn btn-outline btn-sm cursor-pointer">
                          <ImagePlus className="h-4 w-4" /> {p.image ? "Changer la photo" : "Ajouter une photo"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f || !token) return;
                              setError(null);
                              try {
                                const url = await uploadProductImage(token, slug, f);
                                setCatalog({ ...catalog, products: catalog.products.map((x, k) => (k === i ? { ...x, image: url } : x)) });
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Envoi de l’image impossible.");
                              }
                            }}
                          />
                        </label>
                        {p.image && <button type="button" onClick={() => setCatalog({ ...catalog, products: catalog.products.map((x, k) => (k === i ? { ...x, image: null } : x)) })} className="text-xs font-medium text-sage hover:text-ink">Retirer</button>}
                      </div>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => setCatalog({ ...catalog, products: [...catalog.products, { name: "", price: null, description: "", image: null }] })} disabled={catalog.products.length >= 60} className="btn btn-outline btn-sm mt-4"><Plus className="h-4 w-4" /> Ajouter un produit</button>
              </div>
              <button type="button" disabled={busy} onClick={() => persist({ catalog }, "Catalogue et promotion enregistrés : visibles tout de suite sur votre page.")} className="btn btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer</button>
            </>
          )}
        </div>
      )}

      {tab === "reglages" && live && (
        <div className="mt-6 space-y-5">
          <div className="surface p-5">
            <h2 className="text-base font-semibold text-ink">Que peut faire le visiteur après le scan ?</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup">
              {MODES.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={live.requestMode === m.id} disabled={!isPage || busy} onClick={() => persist({ requestMode: m.id }, "Réglage enregistré.")} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50 ${live.requestMode === m.id ? "border-forest bg-forest/5 ring-2 ring-forest/20" : "border-line hover:border-ink/30"}`}>
                  <m.icon className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
                  <span><span className="block text-sm font-semibold text-ink">{m.label}</span><span className="block text-xs text-sage">{m.hint}</span></span>
                </button>
              ))}
            </div>
            {live.requestMode === "order" && live.catalog.products.length === 0 && <p className="mt-3 text-sm text-amber-700">Ajoutez des produits dans « Catalogue & promo » pour que vos clients puissent commander.</p>}
          </div>

          <div className="surface p-5">
            <h2 className="text-base font-semibold text-ink">Établissement</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select className="field max-w-xs" value={live.establishmentId ?? ""} onChange={(e) => persist({ establishmentId: e.target.value || null }, "Établissement mis à jour.")}>
                <option value="">Aucun</option>
                {ests.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button type="button" className="btn btn-outline btn-sm" onClick={async () => { const n = window.prompt("Nom du nouvel établissement"); if (!n || !token) return; try { const e = await addEstablishment(token, n, ""); setEsts([...ests, e]); await persist({ establishmentId: e.id }, "Établissement créé et rattaché."); } catch (err) { setError(err instanceof Error ? err.message : "Création impossible."); } }}><Plus className="h-4 w-4" /> Nouveau</button>
            </div>
          </div>

          {isPage && (
            <div className="surface p-5">
              <h2 className="text-base font-semibold text-ink">Horaires d’ouverture</h2>
              <ul className="mt-4 space-y-2">
                {DAYS.map(([d, label]) => {
                  const s = live.schedule?.[d] ?? { isOpen: false, open: "09:00", close: "19:00" };
                  const upd = (patch: Partial<typeof s>) => setLive({ ...live, schedule: { ...(live.schedule ?? {}), [d]: { ...s, ...patch } } });
                  return (
                    <li key={d} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[7rem_auto_1fr]">
                      <label className="flex items-center gap-2 text-sm font-medium text-ink/85"><input type="checkbox" checked={s.isOpen} onChange={(e) => upd({ isOpen: e.target.checked })} className="h-4 w-4 accent-[var(--color-forest)]" /> {label}</label>
                      <span className="hidden sm:block" />
                      <div className="flex items-center gap-2">
                        <input type="time" className="field max-w-32" value={s.open} disabled={!s.isOpen} onChange={(e) => upd({ open: e.target.value })} aria-label={`${label} ouverture`} />
                        <span className="text-sage">–</span>
                        <input type="time" className="field max-w-32" value={s.close} disabled={!s.isOpen} onChange={(e) => upd({ close: e.target.value })} aria-label={`${label} fermeture`} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button type="button" disabled={busy} onClick={() => persist({ schedule: live.schedule ?? undefined }, "Horaires enregistrés.")} className="btn btn-primary mt-5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer les horaires</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
