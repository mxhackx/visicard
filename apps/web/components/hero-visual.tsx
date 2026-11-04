import { Check, FileText, MapPin, MessageCircle, PlayCircle, RefreshCw, Star } from "lucide-react";

/** Motif QR déterministe (21×21) avec ses trois repères d'angle. Purement décoratif. */
function qrCells(size = 21): boolean[] {
  const cells: boolean[] = [];
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inFinder(x, y)) {
        const fx = x >= size - 7 ? x - (size - 7) : x;
        const fy = y >= size - 7 ? y - (size - 7) : y;
        const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3));
        cells.push(ring !== 2);
      } else if (
        // liseré blanc autour de chaque repère
        (x === 7 && (y < 8 || y >= size - 8)) ||
        (y === 7 && (x < 8 || x >= size - 8)) ||
        (x === size - 8 && y < 8) ||
        (y === size - 8 && x < 8)
      ) {
        cells.push(false);
      } else {
        cells.push(((x * 7 + y * 13 + x * y) % 5) < 2);
      }
    }
  }
  return cells;
}

const CELLS = qrCells();

/** Illustration du hero : un QR imprimé, le téléphone qui le scanne, la page qui s'ouvre. */
export default function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-[1/1] w-full max-w-[480px]"
      data-reveal
      style={{ "--d": "120ms" } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* Anneaux */}
      <div className="absolute inset-[12%] rounded-full border border-forest/15" />
      <div className="absolute inset-[24%] rounded-full border border-dashed border-forest/20" />

      {/* Chevalet de table avec le QR code imprimé */}
      <div className="float-soft absolute left-[2%] top-[20%] w-[42%]">
        <div className="relative rotate-[-6deg] rounded-2xl bg-white p-3 shadow-[0_24px_50px_rgba(37,99,235,0.18)] ring-1 ring-line">
          <p className="text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-sage">
            Scannez-moi
          </p>
          <div className="relative mt-2 overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-line">
            <div className="grid aspect-square w-full grid-cols-[repeat(21,1fr)] gap-0">
              {CELLS.map((on, i) => (
                <span key={i} className={on ? "bg-ink" : "bg-transparent"} />
              ))}
            </div>
            <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-forest text-[9px] font-bold text-white ring-2 ring-white">
              mc
            </span>
            <span className="scan-line" />
          </div>
          <p className="mt-2 text-center text-[10px] font-semibold text-ink/80">Le Comptoir</p>
        </div>
        <div className="mx-auto h-2 w-[70%] rounded-b-xl bg-ink/10" />
      </div>

      {/* Téléphone */}
      <div className="absolute right-[4%] top-[6%] w-[48%]">
        <div className="float-slow rounded-[2.2rem] bg-ink p-[7px] shadow-[0_40px_80px_rgba(15,23,42,0.35)]">
          <div className="relative overflow-hidden rounded-[1.8rem] bg-white">
            <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />

            {/* Couverture */}
            <div className="relative h-28 bg-forest">
              <span className="absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xs font-bold text-forest shadow-md ring-2 ring-white">
                LC
              </span>
            </div>

            <div className="px-4 pb-4 pt-7">
              <p className="text-sm font-semibold text-ink">Le Comptoir</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-sage">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Restaurant · Cotonou
              </p>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[
                  { icon: FileText, label: "Menu" },
                  { icon: MessageCircle, label: "WhatsApp" },
                  { icon: MapPin, label: "Itinéraire" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-lg bg-leaf py-2 text-[8.5px] font-semibold text-forest"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-sage">
                À la carte
              </p>
              <ul className="mt-2 space-y-2">
                {[
                  ["Poulet braisé", "4 500"],
                  ["Garba maison", "2 000"],
                  ["Jus de bissap", "1 000"],
                ].map(([name, price]) => (
                  <li key={name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-md bg-leaf" />
                      <span className="text-[10.5px] text-ink/80">{name}</span>
                    </span>
                    <span className="text-[10.5px] font-semibold text-ink">{price}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-line px-2.5 py-2">
                <PlayCircle className="h-4 w-4 text-forest" />
                <span className="text-[9.5px] font-medium text-ink/75">Vidéo : notre cuisine</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulles flottantes */}
      <div className="float-slow absolute bottom-[14%] left-[6%] flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_14px_34px_rgba(37,99,235,0.18)] ring-1 ring-line [animation-delay:-2s]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[11px] font-semibold text-ink">Scan réussi</span>
          <span className="block text-[9.5px] text-sage">Page ouverte, sans application</span>
        </span>
      </div>

      <div className="float-soft absolute bottom-[4%] right-[10%] flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_14px_34px_rgba(37,99,235,0.18)] ring-1 ring-line [animation-delay:-4s]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf text-forest">
          <RefreshCw className="h-3.5 w-3.5" />
        </span>
        <span>
          <span className="block text-[11px] font-semibold text-ink">Menu mis à jour</span>
          <span className="block text-[9.5px] text-sage">Le QR code reste le même</span>
        </span>
      </div>
    </div>
  );
}
