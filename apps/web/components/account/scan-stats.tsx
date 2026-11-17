"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Globe2, Loader2, Minus, ScanLine, Smartphone } from "lucide-react";
import { fetchScanStats, type ScanStats } from "@/lib/account";

const DEVICE_LABELS: Record<string, string> = { android: "Android", ios: "iPhone / iPad", desktop: "Ordinateur", other: "Autre" };
const RANGES = [7, 30, 90] as const;
const regions = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;
/** Code pays (« BJ ») → nom lisible ; tout autre texte est affiché tel quel. */
const countryName = (c: string) => {
  try {
    return /^[A-Za-z]{2}$/.test(c) ? (regions?.of(c.toUpperCase()) ?? c) : c;
  } catch {
    return c;
  }
};
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

/** Onglet « Statistiques » : scans par jour, appareils, pays et détail par QR code. */
export default function ScanStatsPanel({ token }: { token: string }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<ScanStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchScanStats(token, days)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [token, days]);

  if (error) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="flex items-center gap-2 text-sm text-sage"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>;

  if (data.cards.length === 0) {
    return (
      <div className="surface flex flex-1 flex-col items-center justify-center p-10 text-center">
        <ScanLine className="mx-auto h-8 w-8 text-forest" />
        <h2 className="mt-4 text-lg font-semibold text-ink">Pas encore de statistiques</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-sage">Les scans sont comptés pour vos pages digitales, images, vidéos et PDF. Les QR codes directs (lien, Wi-Fi, appel…) s’ouvrent sans passer par Moncode et ne sont pas comptés.</p>
        <Link href="/creer?type=page" className="btn btn-primary mt-6">Créer une page digitale <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  const trend = data.previous7 === 0 ? (data.last7 > 0 ? 100 : 0) : Math.round(((data.last7 - data.previous7) / data.previous7) * 100);
  const deviceTotal = Object.values(data.devices).reduce((a, b) => a + b, 0);
  const devices = Object.entries(data.devices).sort((a, b) => b[1] - a[1]);
  const topCountry = data.countries[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sage">Scans de vos pages, images, vidéos et PDF.</p>
        <div role="group" aria-label="Période" className="inline-flex rounded-xl border border-line bg-white p-1">
          {RANGES.map((r) => (
            <button key={r} type="button" onClick={() => setDays(r)} aria-pressed={days === r} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${days === r ? "bg-forest text-white" : "text-ink/70 hover:bg-cream-deep"}`}>
              {r} jours
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={`Scans sur ${data.days} jours`} value={data.total.toLocaleString("fr-FR")} />
        <Kpi label="Scans sur 7 jours" value={data.last7.toLocaleString("fr-FR")} trend={trend} />
        <Kpi label="Pays principal" value={topCountry ? countryName(topCountry.country) : "—"} small />
      </div>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink/90">Scans par jour</h2>
        <DayChart points={data.byDay} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink/90"><Smartphone className="h-4 w-4 text-forest" /> Appareils</h2>
          {deviceTotal === 0 ? <p className="mt-4 text-sm text-sage">Aucun scan sur la période.</p> : (
            <ul className="mt-4 space-y-3.5">
              {devices.map(([k, n]) => <Bar key={k} label={DEVICE_LABELS[k] ?? k} value={n} max={deviceTotal} share />)}
            </ul>
          )}
        </section>
        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink/90"><Globe2 className="h-4 w-4 text-forest" /> Pays</h2>
          {data.countries.length === 0 ? <p className="mt-4 text-sm text-sage">La localisation n’est pas disponible pour ces scans.</p> : (
            <ul className="mt-4 space-y-3.5">
              {data.countries.map((c) => <Bar key={c.country} label={countryName(c.country)} value={c.count} max={data.countries[0].count} />)}
            </ul>
          )}
        </section>
      </div>

      <section className="surface overflow-hidden">
        <h2 className="px-5 pt-5 text-base font-semibold text-ink/90 sm:px-6 sm:pt-6">Par QR code</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage">
              <tr><th className="px-5 py-3 sm:px-6">QR code</th><th className="px-4 py-3 text-right">7 jours</th><th className="px-5 py-3 text-right sm:px-6">{data.days} jours</th></tr>
            </thead>
            <tbody>
              {data.cards.map((c) => (
                <tr key={c.slug} className="border-b border-line last:border-0">
                  <td className="max-w-[18rem] truncate px-5 py-3 font-medium text-ink/90 sm:px-6">{c.title}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/80">{c.last7}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink sm:px-6">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, trend, small }: { label: string; value: string; trend?: number; small?: boolean }) {
  const Icon = trend === undefined || trend === 0 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="surface p-4 sm:p-5">
      <p className="text-xs font-medium text-sage">{label}</p>
      <p className={`mt-1.5 font-semibold tracking-[-0.02em] text-ink ${small ? "truncate text-xl" : "text-3xl"}`}>{value}</p>
      {trend !== undefined && (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${trend > 0 ? "text-emerald-700" : trend < 0 ? "text-red-700" : "text-sage"}`}>
          <Icon className="h-3.5 w-3.5" /> {trend > 0 ? "+" : ""}{trend} % vs 7 jours précédents
        </p>
      )}
    </div>
  );
}

/** Barre horizontale d'une seule teinte : la longueur dit la quantité, le libellé reste en encre. */
function Bar({ label, value, max, share }: { label: string; value: number; max: number; share?: boolean }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-ink/85">{label}</span>
        <span className="shrink-0 tabular-nums text-ink/70">{value.toLocaleString("fr-FR")}{share ? ` · ${Math.round(pct)} %` : ""}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-deep">
        <div className="h-full rounded-full bg-forest" style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }} />
      </div>
    </li>
  );
}

/** Histogramme fin, une barre par jour, infobulle au survol ou au toucher. */
function DayChart({ points }: { points: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = useMemo(() => Math.max(1, ...points.map((p) => p.count)), [points]);
  const ticks = [max, Math.round(max / 2), 0];
  const active = hover !== null ? points[hover] : null;
  return (
    <div className="mt-4">
      <p className="h-5 text-sm text-ink/80" aria-live="polite">
        {active ? <><strong className="font-semibold text-ink">{active.count}</strong> scan{active.count > 1 ? "s" : ""} · {dayLabel(active.date)}</> : <span className="text-sage">Survolez une barre pour le détail.</span>}
      </p>
      <div className="mt-2 flex gap-3">
        <div className="flex h-44 flex-col justify-between text-right text-[11px] tabular-nums text-sage" aria-hidden="true">
          {ticks.map((t, i) => <span key={i}>{t}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((_, i) => <span key={i} className="border-t border-line/70" />)}
          </div>
          <ul className="relative flex h-44 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {points.map((p, i) => (
              <li key={p.date} className="group flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                <span
                  role="img"
                  aria-label={`${p.count} scans le ${dayLabel(p.date)}`}
                  className={`block w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-forest-dark" : "bg-forest"}`}
                  style={{ height: p.count > 0 ? `${Math.max((p.count / max) * 100, 3)}%` : "2px", opacity: p.count > 0 ? 1 : 0.25 }}
                />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between text-[11px] text-sage" aria-hidden="true">
            <span>{dayLabel(points[0].date)}</span>
            <span>{dayLabel(points[points.length - 1].date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
