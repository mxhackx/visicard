"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Images,
  Loader2,
  PanelsTopLeft,
  Plus,
  QrCode,
  Receipt,
  ScanLine,
  Wallet,
} from "lucide-react";
import { useAdminFetch } from "./use-admin-fetch";
import { BarChart, MeterList } from "./charts";
import { fcfa, formatDate, STATUS_LABELS, type OrderStatus } from "@/lib/orders";

interface Stats {
  cards: { total: number; thisMonth: number; byStatus: Record<string, number>; byType: Record<string, number> };
  revenue: { total: number; month: number; prevMonth: number; months: { key: string; amount: number; count: number }[] };
  orders: {
    open: number;
    openAmount: number;
    byStatus: Record<string, number>;
    recent: {
      id: string;
      reference: string;
      kind: string;
      serviceType: string;
      status: OrderStatus;
      amount: number;
      customerName: string;
      createdAt: string;
    }[];
  };
  scans: {
    total: number;
    last7: number;
    days: { date: string; count: number }[];
    byDevice: Record<string, number>;
    top: { slug: string; name: string; serviceType: string; count: number }[];
  };
  recentCards: { slug: string; title: string | null; restaurantName: string | null; serviceType: string; status: string; createdAt: string }[];
}

const DEVICE_LABELS: Record<string, string> = { ios: "iPhone / iPad", android: "Android", desktop: "Ordinateur", other: "Autre" };
const TYPE_META: Record<string, { label: string; icon: typeof QrCode }> = {
  page: { label: "Pages digitales", icon: PanelsTopLeft },
  media: { label: "Images / vidéos", icon: Images },
  document: { label: "Documents PDF", icon: FileText },
};
const CARD_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-50 text-emerald-700" },
  draft: { label: "En attente", className: "bg-amber-50 text-amber-700" },
  rejected: { label: "Refusé", className: "bg-red-50 text-red-700" },
};
const ORDER_STATUS_CLASS: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  quote: "bg-cream-deep text-ink/75",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-700",
};

/** Accueil de l'administration : l'activité réelle (paiements, commandes, scans). */
export default function AdminHome({ adminToken }: { adminToken: string }) {
  const adminFetch = useAdminFetch(adminToken);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminFetch("/admin/stats");
        if (!res.ok) throw new Error(res.status === 404 ? "API à relancer : la route des statistiques n’est pas encore chargée." : "Statistiques indisponibles.");
        const data: Stats = await res.json();
        if (alive) setStats(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Statistiques indisponibles.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [adminFetch]);

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sage">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement du tableau de bord…
      </div>
    );
  }

  const trend = stats.revenue.prevMonth > 0 ? Math.round(((stats.revenue.month - stats.revenue.prevMonth) / stats.revenue.prevMonth) * 100) : null;
  const revenueData = stats.revenue.months.map((m) => {
    const date = new Date(`${m.key}-01T12:00:00`);
    return {
      label: date.toLocaleDateString("fr-FR", { month: "short" }),
      title: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      value: m.amount,
      display: `${fcfa(m.amount)} · ${m.count} paiement${m.count > 1 ? "s" : ""}`,
    };
  });
  const scanData = stats.scans.days.map((d) => {
    const date = new Date(`${d.date}T12:00:00`);
    return {
      label: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      title: date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
      value: d.count,
      display: `${d.count} scan${d.count > 1 ? "s" : ""}`,
    };
  });
  const scans30 = stats.scans.days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Indicateurs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="brand-surface rounded-2xl p-5 shadow-[0_16px_40px_rgba(23,23,26,0.28)]">
          <Tile icon={Wallet} label="Encaissé ce mois-ci" light />
          <p className="mt-3 text-2xl font-semibold tabular-nums">{fcfa(stats.revenue.month)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
            {trend === null ? (
              "Premier mois avec des paiements"
            ) : (
              <>
                {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {trend >= 0 ? "+" : ""}
                {trend} % par rapport au mois dernier
              </>
            )}
          </p>
        </div>
        <Kpi icon={Receipt} label="Devis en attente" value={String(stats.orders.open)} note={`${fcfa(stats.orders.openAmount)} à encaisser`} href="/admin?tab=orders" />
        <Kpi
          icon={QrCode}
          label="QR codes actifs"
          value={String(stats.cards.byStatus.active ?? 0)}
          note={`${stats.cards.total} au total · ${stats.cards.thisMonth} ce mois-ci`}
          href="/admin?tab=cards"
        />
        <Kpi icon={ScanLine} label="Scans (7 jours)" value={String(stats.scans.last7)} note={`${stats.scans.total} depuis le début`} />
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Revenus encaissés" subtitle={`6 derniers mois · ${fcfa(stats.revenue.total)} au total`}>
          <BarChart data={revenueData} height={180} ariaLabel="Revenus encaissés par mois" />
        </Panel>
        <Panel title="Scans des pages" subtitle={`30 derniers jours · ${scans30} scan${scans30 > 1 ? "s" : ""}`}>
          <BarChart data={scanData} height={180} labelEvery={7} ariaLabel="Scans par jour sur 30 jours" />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Pages les plus scannées" subtitle="30 derniers jours">
          {stats.scans.top.length ? (
            <ol className="space-y-3">
              {stats.scans.top.map((t, i) => (
                <li key={t.slug} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-leaf text-xs font-semibold text-ambre-deep">{i + 1}</span>
                  <Link href={`/admin/cartes/${t.slug}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink/90 hover:text-forest">
                    {t.name}
                  </Link>
                  <span className="text-sm font-semibold tabular-nums text-ink/90">{t.count}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>Les scans apparaîtront dès qu’une page publiée sera ouverte.</Empty>
          )}
        </Panel>
        <Panel title="Appareils" subtitle="Tous les scans">
          <MeterList
            items={Object.entries(stats.scans.byDevice)
              .sort((a, b) => b[1] - a[1])
              .map(([device, value]) => ({ label: DEVICE_LABELS[device] ?? device, value }))}
          />
        </Panel>
        <Panel title="Catalogue" subtitle="QR codes par service">
          <ul className="space-y-3">
            {Object.entries(TYPE_META).map(([id, meta]) => {
              const Icon = meta.icon;
              return (
                <li key={id} className="flex items-center gap-3">
                  <span className="icon-tile h-9 w-9">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm text-ink/85">{meta.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink/90">{stats.cards.byType[id] ?? 0}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4 text-xs">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{stats.cards.byStatus.draft ?? 0} en attente</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">{stats.cards.byStatus.rejected ?? 0} refusé(s)</span>
          </div>
        </Panel>
      </div>

      {/* Activité */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Dernières commandes"
          action={
            <Link href="/admin?tab=orders" className="inline-flex items-center gap-1 text-sm font-medium text-forest">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {stats.orders.recent.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {stats.orders.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/commandes/${o.reference}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-cream-deep/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink/90">{o.customerName}</p>
                      <p className="text-xs text-sage">
                        {o.reference} · {o.kind === "modification" ? "Modification" : "Création"} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink/90">{fcfa(o.amount)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_CLASS[o.status] ?? ""}`}>{STATUS_LABELS[o.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucune commande pour l’instant.</Empty>
          )}
        </Panel>
        <Panel
          title="Derniers QR codes"
          action={
            <Link href="/admin/nouveau" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Nouveau
            </Link>
          }
        >
          {stats.recentCards.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {stats.recentCards.map((c) => {
                const meta = TYPE_META[c.serviceType] ?? TYPE_META.page;
                const Icon = meta.icon;
                const badge = CARD_STATUS[c.status] ?? CARD_STATUS.active;
                return (
                  <li key={c.slug}>
                    <Link href={`/admin/cartes/${c.slug}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-cream-deep/60">
                      <span className="icon-tile h-9 w-9">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink/90">{c.title || c.restaurantName || c.slug}</p>
                        <p className="text-xs text-sage">{formatDate(c.createdAt)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Aucun QR code pour l’instant.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, light }: { icon: typeof QrCode; label: string; light?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className={`text-sm font-medium ${light ? "text-white/80" : "text-sage"}`}>{label}</p>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${light ? "bg-white/15 text-white" : "bg-leaf text-ambre-deep"}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

function Kpi({ icon, label, value, note, href }: { icon: typeof QrCode; label: string; value: string; note: string; href?: string }) {
  const body = (
    <>
      <Tile icon={icon} label={label} />
      <p className="mt-3 text-2xl font-semibold tabular-nums text-ink/90">{value}</p>
      <p className="mt-1 text-xs text-sage">{note}</p>
    </>
  );
  return href ? (
    <Link href={href} className="surface block rounded-2xl p-5 transition-shadow hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      {body}
    </Link>
  ) : (
    <div className="surface rounded-2xl p-5">{body}</div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink/90">{title}</h2>
          {subtitle && <p className="text-sm text-sage">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-cream-deep/60 px-4 py-6 text-center text-sm text-sage">{children}</p>;
}
