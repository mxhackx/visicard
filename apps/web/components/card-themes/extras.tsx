"use client";

import { BrandIcon, DAYS, todayId, type ScheduleDay } from "./kit";

/** Liste des horaires, jour courant mis en avant. Le style vient des classes reçues. */
export function HoursList({
  schedule,
  className = "",
  rowClassName = "",
  todayClassName = "font-semibold",
  closedClassName = "opacity-60",
}: {
  schedule?: Record<string, ScheduleDay>;
  className?: string;
  rowClassName?: string;
  todayClassName?: string;
  closedClassName?: string;
}) {
  if (!schedule) return null;
  const today = todayId();
  return (
    <dl className={className}>
      {DAYS.map((day) => {
        const h = schedule[day.id];
        return (
          <div key={day.id} className={`flex justify-between gap-4 ${rowClassName} ${day.id === today ? todayClassName : ""}`}>
            <dt>{day.label}</dt>
            <dd className={h?.isOpen ? "" : closedClassName}>{h?.isOpen ? `${h.open} – ${h.close}` : "Fermé"}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Bouton WhatsApp flottant (masqué dans l'aperçu de l'éditeur). */
export function WhatsAppFab({ href, hidden, className = "" }: { href?: string; hidden?: boolean; className?: string }) {
  if (!href || hidden) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Écrire sur WhatsApp"
      className={`fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] ${className}`}
    >
      <BrandIcon id="whatsapp" className="h-7 w-7" />
    </a>
  );
}
