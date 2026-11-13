"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";

export type Device = "phone" | "tablet" | "laptop" | "desktop";

/** Taille réelle de l'écran simulé : la page s'y affiche à sa vraie largeur, puis est réduite. */
const DEVICES: Record<Device, { label: string; width: number; height: number; icon: typeof Laptop; max: number }> = {
  phone: { label: "Téléphone", width: 390, height: 844, icon: Smartphone, max: 320 },
  tablet: { label: "iPad", width: 820, height: 1180, icon: Tablet, max: 400 },
  laptop: { label: "Mac", width: 1440, height: 900, icon: Laptop, max: 1100 },
  desktop: { label: "Ordinateur", width: 1920, height: 1080, icon: Monitor, max: 1100 },
};

export function DeviceSwitch({
  value,
  onChange,
  devices,
}: {
  value: Device;
  onChange: (d: Device) => void;
  /** Appareils proposés (tous par défaut). */
  devices?: readonly Device[];
}) {
  return (
    <div className="inline-flex max-w-full rounded-xl border border-line bg-white p-1" role="radiogroup" aria-label="Appareil d’aperçu">
      {(Object.keys(DEVICES) as Device[]).filter((id) => !devices || devices.includes(id)).map((id) => {
        const { label, icon: Icon } = DEVICES[id];
        const on = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
              on ? "bg-forest text-white" : "text-ink/70 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Cadre d'appareil avec l'écran mis à l'échelle de la place disponible. */
/** `scrollable` : la page simulée défile à l'intérieur du cadre (pages longues) ; sinon le cadre ne capte pas le défilement. */
export default function DevicePreview({ device, children, scrollable = false }: { device: Device; children: ReactNode; scrollable?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const spec = DEVICES[device];
  const bezel = device === "phone" ? 20 : device === "tablet" ? 28 : device === "laptop" ? 24 : 28;
  const target = Math.min(spec.max, Math.max(0, available - bezel));
  const scale = target > 0 ? target / spec.width : 0;
  const w = spec.width * scale;
  const h = spec.height * scale;

  const screen = (
    <div className="relative overflow-hidden bg-white" style={{ width: w, height: h }}>
      {/* L'échelle (et donc le bloc conteneur des éléments `fixed`) est sur ce cadre fixe ;
          le défilement se fait à l'intérieur : visionneuses et barres collantes restent dans l'écran. */}
      <div className="absolute left-0 top-0 [transform-origin:0_0]" style={{ width: spec.width, height: spec.height, transform: `scale(${scale})` }}>
        <div className={`h-full w-full overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-y-hidden"}`}>{children}</div>
      </div>
    </div>
  );

  return (
    <div ref={host} className="flex w-full justify-center">
      {scale > 0 && device === "phone" && (
        <div className="relative rounded-[2.6rem] bg-ink p-[10px] shadow-[0_30px_60px_rgba(15,23,42,0.25)]">
          <div className="absolute left-1/2 top-[10px] z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-ink" />
          <div className="overflow-hidden rounded-[2rem]">{screen}</div>
        </div>
      )}

      {scale > 0 && device === "tablet" && (
        <div className="rounded-[1.6rem] bg-ink p-[13px] shadow-[0_30px_60px_rgba(15,23,42,0.25)]">
          <div className="overflow-hidden rounded-[0.9rem]">{screen}</div>
        </div>
      )}

      {scale > 0 && device === "laptop" && (
        <div className="flex flex-col items-center">
          <div className="relative rounded-t-[14px] border border-[#2b2b2f] bg-[#111114] p-3 pb-3 shadow-[0_24px_50px_rgba(15,23,42,0.22)]">
            <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#2f3036]" />
            <div className="overflow-hidden rounded-[3px]">{screen}</div>
          </div>
          <div className="relative h-3.5 rounded-b-[14px] bg-gradient-to-b from-[#d9dbe0] to-[#a9adb6]" style={{ width: w + 24 + 80 }}>
            <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-[#9a9ea7]" />
          </div>
        </div>
      )}

      {scale > 0 && device === "desktop" && (
        <div className="flex flex-col items-center">
          <div className="rounded-[14px] bg-[#16161a] p-[14px] shadow-[0_24px_50px_rgba(15,23,42,0.22)]">
            <div className="overflow-hidden rounded-[3px]">{screen}</div>
          </div>
          <div className="h-12 w-20 bg-gradient-to-b from-[#b9bcc4] to-[#d6d8de] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]" />
          <div className="h-2 w-48 rounded-full bg-[#c9ccd3]" />
        </div>
      )}
    </div>
  );
}
