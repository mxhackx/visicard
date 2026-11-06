import type { DirectQrType } from "@/lib/qr-payloads";

const INK = "#17171a";
const RED = "#e3051d";
const SOFT = "#fde8ea";

/** Petites illustrations SVG (64×64) : une par type de QR code. */
export default function TypeArt({ type, className = "h-16 w-16" }: { type: DirectQrType; className?: string }) {
  const common = { viewBox: "0 0 64 64", className, fill: "none", "aria-hidden": true } as const;
  switch (type) {
    case "wifi":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill={SOFT} />
          <path d="M14 26a26 26 0 0 1 36 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M20 33a17 17 0 0 1 24 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M26 40a8 8 0 0 1 12 0" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="32" cy="46" r="3" fill={RED} />
        </svg>
      );
    case "vcard":
      return (
        <svg {...common}>
          <rect x="6" y="14" width="52" height="36" rx="6" fill="#fff" stroke={INK} strokeWidth="3" />
          <circle cx="22" cy="28" r="6" fill={RED} />
          <path d="M12 44c1-6 5-8 10-8s9 2 10 8" fill={SOFT} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 26h14M38 33h14M38 40h9" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "tel":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill={SOFT} />
          <path d="M22 16h6l3 8-4 3a20 20 0 0 0 10 10l3-4 8 3v6a4 4 0 0 1-4 4C28 46 18 34 18 20a4 4 0 0 1 4-4z" fill={INK} />
          <path d="M40 18a10 10 0 0 1 6 6M40 12a16 16 0 0 1 12 12" stroke={RED} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "sms":
      return (
        <svg {...common}>
          <path d="M8 14a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H28l-12 10V44h-2a6 6 0 0 1-6-6z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="22" cy="26" r="3" fill={RED} />
          <circle cx="32" cy="26" r="3" fill={INK} />
          <circle cx="42" cy="26" r="3" fill={INK} />
        </svg>
      );
    case "email":
      return (
        <svg {...common}>
          <rect x="6" y="14" width="52" height="36" rx="6" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M8 18l24 18 24-18" stroke={RED} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "text":
      return (
        <svg {...common}>
          <rect x="10" y="8" width="44" height="48" rx="6" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M18 20h28M18 29h28M18 38h18" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <rect x="18" y="45" width="12" height="4" rx="2" fill={RED} />
        </svg>
      );
    case "event":
      return (
        <svg {...common}>
          <rect x="8" y="12" width="48" height="44" rx="6" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M8 26h48" stroke={INK} strokeWidth="3" />
          <path d="M20 8v10M44 8v10" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="16" y="33" width="10" height="9" rx="2" fill={SOFT} />
          <rect x="30" y="33" width="10" height="9" rx="2" fill={RED} />
          <rect x="44" y="33" width="6" height="9" rx="2" fill={SOFT} />
        </svg>
      );
    case "geo":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill={SOFT} />
          <path d="M32 10c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="32" cy="26" r="6" fill="#fff" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="28" fill={SOFT} />
          <path d="M26 38l12-12M29 22l3-3a8 8 0 0 1 11 11l-3 3M35 42l-3 3a8 8 0 0 1-11-11l3-3" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
  }
}
