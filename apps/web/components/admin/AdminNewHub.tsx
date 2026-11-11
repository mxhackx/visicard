"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Images,
  PanelsTopLeft,
  QrCode,
  Receipt,
} from "lucide-react";
import AdminShell from "./AdminShell";
import { useAdminFetch } from "./use-admin-fetch";
import { SERVICES, type ServiceType } from "@/lib/services";
import { fcfa, STATUS_LABELS, type OrderStatus } from "@/lib/orders";

const ICONS: Record<ServiceType, typeof PanelsTopLeft> = { page: PanelsTopLeft, media: Images, document: FileText };

const ADMIN_ROUTE: Record<ServiceType, string> = {
  page: "/admin/nouveau/informations",
  media: "/admin/nouveau/media",
  document: "/admin/nouveau/document",
};

const CLIENT_START: Record<ServiceType, string> = {
  page: "/creer?type=page",
  media: "/creer?type=media",
  document: "/creer?type=document",
};

interface Step {
  label: string;
  route: string;
  href?: string;
  who: string;
}

/** Le parcours client, étape par étape, avec l'adresse de chaque écran. */
const JOURNEYS: Record<ServiceType, Step[]> = {
  page: [
    { label: "Choix du service", route: "/creer?type=page", href: "/creer?type=page", who: "Client" },
    { label: "Informations et photos", route: "/creer?type=page", href: "/creer?type=page&etape=informations", who: "Client" },
    { label: "Apparence (thème)", route: "/creer?type=page", href: "/creer?type=page&etape=apparence", who: "Client" },
    { label: "Coordonnées et devis", route: "/creer?type=page", href: "/creer?type=page&etape=paiement", who: "Client" },
    { label: "Aperçu et paiement sur WhatsApp", route: "/commande/[réf]", who: "Client" },
    { label: "Encaisser → QR actif, facture", route: "/admin?tab=orders", who: "Admin" },
    { label: "Modification = nouveau devis", route: "/commande/[réf]/modifier", who: "Client" },
  ],
  media: [
    { label: "Fichier et coordonnées", route: "/creer?type=media", href: "/creer?type=media", who: "Client" },
    { label: "Aperçu et paiement sur WhatsApp", route: "/commande/[réf]", who: "Client" },
    { label: "Encaisser → QR actif, facture", route: "/admin?tab=orders", who: "Admin" },
    { label: "Modification = nouveau devis", route: "/commande/[réf]/modifier", who: "Client" },
  ],
  document: [
    { label: "PDF et coordonnées", route: "/creer?type=document", href: "/creer?type=document", who: "Client" },
    { label: "Aperçu et paiement sur WhatsApp", route: "/commande/[réf]", who: "Client" },
    { label: "Encaisser → QR actif, facture", route: "/admin?tab=orders", who: "Admin" },
    { label: "Modification = nouveau devis", route: "/commande/[réf]/modifier", who: "Client" },
  ],
};

export default function AdminNewHub() {
  return (
    <AdminShell active="new" title="Nouveau QR code" hint="Créer pour un client, ou parcourir le site comme un client">
      {(token) => <HubBody adminToken={token} />}
    </AdminShell>
  );
}

function HubBody({ adminToken }: { adminToken: string }) {
  const [journey, setJourney] = useState<ServiceType>("page");

  return (
    <div className="space-y-10">
      {/* 1. Les trois parcours */}
      <section>
        <h2 className="text-base font-semibold text-ink/90">Que voulez-vous créer ?</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = ICONS[service.id];
            return (
              <article key={service.id} className="surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink/80">{service.price} FCFA</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink/90">{service.name}</h3>
                <p className="mt-1 text-sm leading-6 text-sage">{service.tagline}</p>
                <div className="mt-5 flex flex-col gap-2 pt-1">
                  <Link href={ADMIN_ROUTE[service.id]} className="btn btn-primary btn-sm justify-between">
                    Créer pour un client
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={CLIENT_START[service.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm justify-between"
                  >
                    Tester le parcours client
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-3 text-xs text-sage">
                  Création admin : QR actif tout de suite, sans devis ni paiement.
                </p>
              </article>
            );
          })}
        </div>

        <Link
          href="/admin/nouveau/direct"
          className="surface mt-4 flex flex-col gap-4 p-5 transition-colors hover:bg-cream-deep/40 sm:flex-row sm:items-center"
        >
          <span className="icon-tile">
            <QrCode className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-ink/90">QR code simple</span>
            <span className="mt-1 block text-sm leading-6 text-sage">
              Lien web, texte, carte de visite (vCard), appel, SMS, e-mail, Wi-Fi, événement ou coordonnées GPS,
              écrits dans le QR lui-même. Tous contenus libres pour l’équipe ; les clients paient 5 000 FCFA (hors lien) sur /creer.
            </span>
          </span>
          <span className="btn btn-primary btn-sm shrink-0 justify-between gap-2">
            Générer
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>

      {/* 2. Le parcours client complet */}
      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink/90">Parcours client complet</h2>
            <p className="text-sm text-sage">Chaque écran, son adresse et qui agit. Cliquez pour ouvrir l’étape.</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-cream-deep p-1">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setJourney(s.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  journey === s.id ? "bg-white text-forest shadow-sm" : "text-ink/70 hover:text-ink"
                }`}
              >
                {s.shortName}
              </button>
            ))}
          </div>
        </div>
        <ol className="divide-y divide-line">
          {JOURNEYS[journey].map((step, index) => (
            <li key={step.route + step.label} className="flex items-center gap-4 px-5 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-semibold text-ambre-deep">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink/90">{step.label}</p>
                <code className="text-xs text-sage">{step.route}</code>
              </div>
              <span
                className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${
                  step.who === "Automatique" ? "bg-emerald-50 text-emerald-700" : "bg-cream-deep text-ink/70"
                }`}
              >
                {step.who}
              </span>
              {step.href ? (
                <a href={step.href} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm shrink-0">
                  Ouvrir
                </a>
              ) : (
                <span className="w-[74px] shrink-0 text-right text-xs text-sage">via le devis</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <RecentOrders adminToken={adminToken} />
    </div>
  );
}

/* -------------------------- Dernières commandes clients -------------------------- */

interface RecentOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  amount: number;
  customerName: string;
  createdAt: string;
}

function RecentOrders({ adminToken }: { adminToken: string }) {
  const adminFetch = useAdminFetch(adminToken);
  const [orders, setOrders] = useState<RecentOrder[] | null>(null);

  useEffect(() => {
    adminFetch("/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: RecentOrder[]) => setOrders(list.slice(0, 6)))
      .catch(() => setOrders([]));
  }, [adminFetch]);

  return (
    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink/90">
          <Receipt className="h-5 w-5 text-forest" /> Dernières commandes
        </h2>
        <Link href="/admin?tab=orders" className="text-sm font-semibold text-forest hover:text-forest-dark">
          Tout voir
        </Link>
      </div>
      {orders === null ? (
        <p className="px-5 py-8 text-center text-sm text-sage">Chargement…</p>
      ) : orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-sage">
          Aucune commande. Testez un parcours client pour en créer une.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/commandes/${o.reference}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-cream-deep/60"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink/90">{o.reference}</span>
                  <span className="block truncate text-xs text-sage">{o.customerName}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-ink/90">{fcfa(o.amount)}</span>
                  <span className="block text-xs text-sage">{STATUS_LABELS[o.status]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
