type Variant = "dark" | "light";

const WORD_TEXT: Record<Variant, string> = {
  dark: "text-ink",
  light: "text-cream",
};

const SIGNATURE_TEXT: Record<Variant, string> = {
  dark: "text-sage",
  light: "text-white/70",
};

/** Le sigle seul : un QR code vu de près, avec sa ligne de scan. */
export function LogoMark({
  className = "h-8 w-8",
  variant = "dark",
}: {
  className?: string;
  variant?: Variant;
}) {
  const tile = variant === "light" ? "#ffffff" : "#2563eb";
  const ink = variant === "light" ? "#1d4ed8" : "#ffffff";

  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="7" fill={tile} />
      <g fill="none" stroke={ink} strokeWidth="2">
        <rect x="6" y="6" width="7" height="7" rx="1" />
        <rect x="19" y="6" width="7" height="7" rx="1" />
        <rect x="6" y="19" width="7" height="7" rx="1" />
      </g>
      <g fill={ink}>
        <rect x="8.5" y="8.5" width="2" height="2" />
        <rect x="21.5" y="8.5" width="2" height="2" />
        <rect x="8.5" y="21.5" width="2" height="2" />
        <rect x="18.5" y="21.75" width="9" height="2.5" rx="1.25" />
      </g>
    </svg>
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
      <LogoMark variant={variant} className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={`text-[1.05rem] font-semibold tracking-tight ${
            variant === "light" ? WORD_TEXT.light : WORD_TEXT.dark
          }`}
        >
          moncode
        </span>
        <span
          className={`mt-1 text-[8.5px] font-medium uppercase tracking-[0.24em] ${
            variant === "light" ? SIGNATURE_TEXT.light : SIGNATURE_TEXT.dark
          }`}
        >
          Pages & QR codes
        </span>
      </span>
    </span>
  );
}
