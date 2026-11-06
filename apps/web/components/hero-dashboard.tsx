"use client";

import { useRef } from "react";
import { FileText, Images, Link2, MessageCircle, PanelsTopLeft, Wifi, type LucideIcon } from "lucide-react";
import { CELLS } from "@/components/hero-visual";

const SIZE = 21;

function MiniQr({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={SIZE} height={SIZE} fill="#fff" />
      {CELLS.map((on, i) => on && <rect key={i} x={i % SIZE} y={Math.floor(i / SIZE)} width="1" height="1" fill="#17171a" />)}
    </svg>
  );
}

const ROWS = [
  { name: "Moncode · Page", type: "Page digitale", active: true },
  { name: "Moncode · Menu", type: "PDF", active: true },
  { name: "Moncode · Wi-Fi", type: "Wi-Fi", active: false },
];

const TYPES: { label: string; icon: LucideIcon; on?: boolean }[] = [
  { label: "Lien", icon: Link2, on: true },
  { label: "Page", icon: PanelsTopLeft },
  { label: "PDF", icon: FileText },
  { label: "Image", icon: Images },
  { label: "Wi-Fi", icon: Wifi },
  { label: "WhatsApp", icon: MessageCircle },
];

/**
 * Maquette de l'espace client : la liste de ses QR codes et le choix du type.
 * Légère inclinaison 3D qui suit la souris ; fixe sur mobile et avec « réduire les animations ».
 */
export default function HeroDashboard() {
  const stage = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !stage.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    stage.current.style.setProperty("--ry", `${-8 + ((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
    stage.current.style.setProperty("--rx", `${3 - ((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
  };
  const leave = () => {
    stage.current?.style.removeProperty("--ry");
    stage.current?.style.removeProperty("--rx");
  };

  return (
    <div className="relative mx-auto w-full max-w-[540px] [perspective:1400px]" onPointerMove={move} onPointerLeave={leave} aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest/[0.08]" />
      <div ref={stage} className="hero3d-stage relative aspect-[1/1.05] sm:aspect-[1/0.92] [--rx:3deg] [--ry:-8deg] [transform-style:preserve-3d]">
        {/* Mes QR codes */}
        <div className="absolute left-[1%] top-[3%] w-[74%] sm:left-[2%] sm:top-[6%] sm:w-[62%] rounded-2xl bg-white p-4 shadow-[0_24px_50px_rgba(23,23,26,0.12)] ring-1 ring-black/5 sm:p-5">
          <p className="text-sm font-semibold text-ink">Mes QR codes</p>
          <ul className="mt-3 space-y-3">
            {ROWS.map((r) => (
              <li key={r.name} className="flex items-center gap-3">
                <MiniQr className="h-11 w-11 shrink-0 rounded-lg ring-1 ring-line sm:h-12 sm:w-12" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{r.name}</span>
                  <span className="block text-[11px] text-sage">{r.type}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-line text-sage"}`}>
                  {r.active ? "Actif" : "En pause"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Choisir le type */}
        <div className="hero3d-float absolute bottom-[2%] right-0 w-[72%] sm:bottom-[4%] sm:w-[62%] rounded-2xl bg-white p-4 shadow-[0_28px_60px_rgba(23,23,26,0.16)] ring-1 ring-black/5 [transform:translateZ(50px)] sm:p-5">
          <p className="text-sm font-semibold text-ink">Choisir le type</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <span
                key={t.label}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium ${
                  t.on ? "bg-forest text-white" : "bg-cream text-ink/80"
                }`}
              >
                <t.icon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Pastille QR flottante */}
        <div className="hero3d-float absolute left-[8%] bottom-[10%] hidden rounded-2xl sm:block bg-white p-2.5 shadow-[0_20px_40px_rgba(23,23,26,0.14)] ring-1 ring-black/5 [animation-delay:-2s] [transform:translateZ(80px)]">
          <MiniQr className="h-16 w-16 rounded-lg sm:h-20 sm:w-20" />
        </div>
      </div>
    </div>
  );
}
