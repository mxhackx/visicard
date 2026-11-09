import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false, follow: false } };

/** 404 : un QR code qui ne mène nulle part, un seul bouton pour revenir à l'accueil. Ni en-tête ni pied de page. */
export default function NotFound() {
  return (
    <main className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-[radial-gradient(60%_50%_at_50%_30%,rgba(227,5,29,0.07),transparent_70%),linear-gradient(#fff,#fbf5f5)] px-6 text-center">
      <svg viewBox="0 0 240 200" className="h-48 w-auto sm:h-60" role="img" aria-label="QR code brisé" fill="none">
        <ellipse cx="120" cy="184" rx="78" ry="9" fill="#17171a" opacity="0.07" />
        {/* Cadre de scan */}
        <path d="M44 62V40a10 10 0 0 1 10-10h22M196 62V40a10 10 0 0 0-10-10h-22M44 138v22a10 10 0 0 0 10 10h22M196 138v22a10 10 0 0 1-10 10h-22" stroke="#e3051d" strokeWidth="6" strokeLinecap="round" />
        {/* Repères du QR code */}
        <g fill="#17171a">
          <rect x="66" y="52" width="38" height="38" rx="8" />
          <rect x="136" y="52" width="38" height="38" rx="8" />
          <rect x="66" y="110" width="38" height="38" rx="8" />
        </g>
        <g fill="#fff">
          <rect x="75" y="61" width="20" height="20" rx="4" />
          <rect x="145" y="61" width="20" height="20" rx="4" />
          <rect x="75" y="119" width="20" height="20" rx="4" />
        </g>
        <g fill="#e3051d">
          <rect x="81" y="67" width="8" height="8" rx="2" />
          <rect x="151" y="67" width="8" height="8" rx="2" />
          <rect x="81" y="125" width="8" height="8" rx="2" />
        </g>
        {/* Modules éparpillés : le code est cassé */}
        <g fill="#17171a">
          <rect x="136" y="112" width="12" height="12" rx="3" />
          <rect x="154" y="124" width="12" height="12" rx="3" transform="rotate(14 160 130)" />
          <rect x="128" y="136" width="10" height="10" rx="3" opacity="0.5" />
          <rect x="170" y="108" width="8" height="8" rx="2" opacity="0.4" />
        </g>
        {/* Point d'interrogation */}
        <circle cx="168" cy="146" r="17" fill="#e3051d" />
        <path d="M162 141.5a6.2 6.2 0 1 1 8.6 5.7c-1.7.8-2.6 1.7-2.6 3.3" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="168" cy="157" r="2" fill="#fff" />
      </svg>

      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-forest">Erreur 404</p>
      <h1 className="page-title mt-2">Page introuvable</h1>
      <p className="mt-3 max-w-md text-base leading-7 text-sage">
        Ce QR code ne mène nulle part : la page n’existe pas ou a été déplacée.
      </p>
      <Link href="/" className="btn btn-primary mt-8 px-8 py-3.5 text-base">
        <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
      </Link>
    </main>
  );
}
