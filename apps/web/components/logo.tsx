import Image from "next/image";

type Variant = "dark" | "light";

const WORD_TEXT: Record<Variant, string> = {
  dark: "text-ink",
  light: "text-white",
};

const SIGNATURE_TEXT: Record<Variant, string> = {
  dark: "text-sage",
  light: "text-white/70",
};

const TILE_RING: Record<Variant, string> = {
  dark: "ring-white/10",
  light: "ring-white/15",
};

/** Le sigle seul : l'emblème Moncode (QR blanc, cornets rouges, monogramme M). */
export function LogoMark({
  className = "h-8 w-8",
  variant = "dark",
}: {
  className?: string;
  variant?: Variant;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-[10px] ring-1 ${TILE_RING[variant]} ${className}`}
    >
      <Image
        src="/logo.png"
        alt=""
        width={512}
        height={512}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}

/** Logo complet : sigle + nom de la marque. */
export default function Logo({
  variant = "dark",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark variant={variant} className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span
          className={`text-[1.05rem] font-semibold tracking-tight ${WORD_TEXT[variant]}`}
        >
          moncode
        </span>
        <span
          className={`mt-1 text-[8.5px] font-medium uppercase tracking-[0.24em] ${SIGNATURE_TEXT[variant]}`}
        >
          Pages & QR codes
        </span>
      </span>
    </span>
  );
}
