"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, FileText, Images, Loader2, Pencil, PanelsTopLeft, QrCode, Trash2 } from "lucide-react";
import type { CardSummary } from "./AdminCardsList";
import StyledQr from "@/components/qr/styled-qr";

const typeMeta: Record<string, { label: string; icon: typeof QrCode; className: string }> = {
  page: { label: "Page", icon: PanelsTopLeft, className: "bg-leaf text-forest" },
  media: { label: "Image / vidéo", icon: Images, className: "bg-violet-50 text-violet-700" },
  document: { label: "PDF", icon: FileText, className: "bg-amber-50 text-amber-700" },
};


export function AdminTable({
  cards,
  onEdit,
  onDelete,
}: {
  cards: CardSummary[];
  onEdit: (card: CardSummary) => void;
  onDelete: (slug: string) => Promise<boolean>;
}) {
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmCard = cards.find((c) => c.slug === confirmSlug);

  return (
    <div className="surface overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Contenu</th>
              <th className="px-4 py-3.5 font-semibold">Type</th>
              <th className="px-4 py-3.5 font-semibold">Client</th>
              <th className="px-4 py-3.5 text-right font-semibold">Scans</th>
              <th className="px-4 py-3.5 font-semibold">Création</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {cards.map((card) => {
              const meta = typeMeta[card.serviceType ?? "page"] ?? typeMeta.page;
              const TypeIcon = meta.icon;
              const name = card.title || card.restaurantName || "Sans titre";

              return (
                <tr key={card.id} className="transition-colors hover:bg-cream-deep/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/cartes/${card.slug}`} className="shrink-0 rounded-lg ring-1 ring-line" aria-label="Voir le QR code">
                        <StyledQr data={card.cardUrl} style={card.qrStyle} size={44} />
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/admin/cartes/${card.slug}`} className="block truncate font-semibold text-ink/90 hover:text-forest">
                          {name}
                        </Link>
                        <p className="truncate text-xs text-sage">
                          /c/{card.slug}
                          {card.status === "draft" && (
                            <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                              En attente de paiement
                            </span>
                          )}
                          {card.status === "rejected" && (
                            <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                              Refusé
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink/75">{card.clientName || card.userName || "—"}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    <span className={card.scans ? "font-semibold text-ink/90" : "text-sage"}>{card.scans ?? 0}</span>
                  </td>
                  <td className="px-4 py-3.5 text-ink/75">
                    {new Date(card.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <IconLink href={`/admin/cartes/${card.slug}`} label="Voir la fiche (contenu, commandes, refus)">
                        <Eye className="h-4 w-4" />
                      </IconLink>
                      <IconLink href={`/c/${card.slug}`} label="Ouvrir la page publique" external>
                        <ExternalLink className="h-4 w-4" />
                      </IconLink>
                      <IconButton label="Modifier" onClick={() => onEdit(card)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Supprimer" danger onClick={() => setConfirmSlug(card.slug)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 id="delete-title" className="text-lg font-semibold text-ink/90">
              Supprimer ce QR code ?
            </h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              « {confirmCard.title || confirmCard.restaurantName || confirmCard.slug} » et ses fichiers seront
              supprimés définitivement. Le QR code imprimé ne fonctionnera plus.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmSlug(null)}
                className="btn btn-outline flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  const ok = await onDelete(confirmCard.slug);
                  setDeleting(false);
                  if (ok) setConfirmSlug(null);
                }}
                className="btn flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sage transition-colors hover:bg-leaf hover:text-forest";

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={danger ? `${iconClass} hover:!bg-red-50 hover:!text-red-600` : iconClass}
    >
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      target={external ? "_blank" : undefined}
      className={iconClass}
    >
      {children}
    </Link>
  );
}
