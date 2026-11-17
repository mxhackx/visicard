import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CodeTabs from "@/components/code-tabs";
import { Crown, KeyRound, Link2, Mail, MapPin, MessageSquare, Phone, Type, Wifi, ArrowRight } from "lucide-react";
import JsonLd from "@/components/json-ld";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { API_URL } from "@/lib/api-url";

export const metadata: Metadata = pageMetadata({
  title: "API développeurs : générer des QR codes",
  description: "Générez des QR codes (PNG ou SVG) depuis votre application avec l’API Moncode : clé d’API, quotas clairs, exemples prêts à copier.",
  path: "/developpeurs",
});

const BASE = API_URL.startsWith("http://localhost") ? "https://api.moncode.bj" : API_URL;

const TYPES: { id: string; fields: string; premium: boolean; icon: typeof Link2 }[] = [
  { id: "url", fields: "data (http:// ou https://)", premium: false, icon: Link2 },
  { id: "text", fields: "data", premium: true, icon: Type },
  { id: "wifi", fields: "ssid, password, security (WPA, WEP, nopass), hidden", premium: true, icon: Wifi },
  { id: "tel", fields: "phone", premium: true, icon: Phone },
  { id: "sms", fields: "phone, message", premium: true, icon: MessageSquare },
  { id: "email", fields: "to, subject, body", premium: true, icon: Mail },
  { id: "geo", fields: "lat, lng", premium: true, icon: MapPin },
];

const OPTIONS: [string, string, string][] = [
  ["format", "png ou svg", "png"],
  ["size", "100 à 2000 (pixels)", "512"],
  ["margin", "0 à 10 (modules)", "2"],
  ["fg / bg", "couleurs hexadécimales, ex. #e3051d", "#111827 / #ffffff"],
  ["ecc", "L, M, Q ou H (correction d’erreur)", "M"],
  ["encoding", "json pour recevoir une data URL au lieu du fichier", "—"],
];

const ERRORS: [string, string, string][] = [
  ["400", "Requête invalide", "Paramètre manquant ou invalide : le message l’explique."],
  ["401", "Clé refusée", "Clé absente, invalide ou révoquée."],
  ["402", "Premium requis", "Ce contenu est réservé aux comptes Premium (tout sauf les liens). La réponse renvoie upgradeUrl, le lien du paiement (5 000 FCFA par Mobile Money)."],
  ["429", "Trop de requêtes", "Quota mensuel atteint ou trop d’appels à la minute."],
];

const EXAMPLES = [
  {
    id: "lien",
    label: "Lien · PNG",
    language: "curl",
    code: `curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"url","data":"https://moncode.bj","fg":"#e3051d","size":600}' \\
  -o qr.png`,
  },
  {
    id: "wifi",
    label: "Wi-Fi · SVG",
    language: "curl",
    code: `curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"wifi","ssid":"Moncode","password":"motdepasse","format":"svg"}' \\
  -o wifi.svg`,
  },
  {
    id: "js",
    label: "JavaScript",
    language: "JavaScript",
    code: `const res = await fetch("${BASE}/v1/qr", {
  method: "POST",
  headers: { "X-API-Key": process.env.MONCODE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "url", data: "https://moncode.bj", encoding: "json" }),
});
const { dataUrl } = await res.json(); // "data:image/png;base64,…"`,
  },
];

/** En-tête d'une section : un titre, un sous-titre, comme en haut de page. */
function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-[clamp(2rem,7vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-sage">{subtitle}</p>
    </div>
  );
}

/** Une bande de la page : grande respiration, fond alterné. */
function Band({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="anchor">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">{children}</div>
    </section>
  );
}

export default function DeveloppeursPage() {
  return (
    <main className="page-hero-bg min-h-screen">
      <JsonLd data={breadcrumbJsonLd([["Accueil", "/"], ["API développeurs", "/developpeurs"]])} />
      <Header />
      {/* Pas d'espaceur : le fond du hero passe derrière l'en-tête, qui est transparent (même fond, sans coupure). */}

      {/* En-tête simple : un titre, un sous-titre, une image, sur toute la hauteur de l'écran. */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-[calc(var(--header-h)+1px)]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-14 lg:px-8">
          <div className="text-center lg:text-left">
            <h1 className="text-[clamp(2.6rem,11vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink lg:text-[4.2rem]">
              L’API <span className="text-forest">Moncode</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-sage lg:mx-0 lg:max-w-lg lg:text-xl lg:leading-9">
              Une requête HTTP, un QR code en retour. Directement depuis votre site ou votre application.
            </p>
            <div className="mt-8">
              <Link href="/compte?onglet=cles-api" className="btn btn-primary w-full justify-center py-3.5 text-base sm:w-auto sm:px-8"><KeyRound className="h-4 w-4" /> Obtenir une clé</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <Image src="/illustrations/api-qr.svg" alt="Une requête de code envoie un QR code en retour" width={640} height={460} priority unoptimized className="h-auto w-full" />
          </div>
        </div>
      </section>

      <Band id="quotas">
        <SectionHead title="Des quotas clairs" subtitle="Les liens sont gratuits. Tout le reste passe par Premium." />
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            ["1 000", "requêtes par mois", "gratuites, pour les liens simples"],
            ["5 000", "requêtes par mois", "avec Premium, tous les contenus"],
            ["5", "clés actives", "par compte"],
          ].map(([v, l, d]) => (
            <div key={l + v} className="rounded-3xl border border-line bg-white p-7 text-center shadow-[0_18px_44px_rgba(23,23,26,0.07)]">
              <p className="text-5xl font-bold tracking-[-0.03em] text-forest">{v}</p>
              <p className="mt-3 text-base font-semibold text-ink">{l}</p>
              <p className="mt-1 text-sm text-sage">{d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] leading-7 text-sage">
          Le quota se renouvelle le 1<sup>er</sup> de chaque mois. Au-delà, l’API répond <code>429</code> et l’en-tête <code>Retry-After</code> indique quand réessayer. Besoin de plus ? <Link href="/contact" className="font-semibold text-forest hover:underline">Écrivez-nous</Link>.
        </p>

        {/* Passer en Premium : le compte porte l'offre, la clé n'a rien à changer. */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-5 rounded-3xl border border-line bg-white p-6 text-center shadow-[0_18px_44px_rgba(23,23,26,0.07)] sm:flex-row sm:text-left">
          <span className="icon-tile h-12 w-12 shrink-0"><Crown className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-ink">Passer en Premium avec l’API</h3>
            <p className="mt-1 text-sm leading-6 text-sage">
              Payez 5 000 FCFA par Mobile Money sur le site : votre compte passe en Premium pendant un an, et vos clés existantes débloquent tous les contenus sans rien changer côté code.
            </p>
          </div>
          <Link href="/paiement?suite=%2Fdeveloppeurs" className="btn btn-primary btn-sm shrink-0">
            Passer en Premium <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Band>

      <Band id="exemples">
        <SectionHead title="Un appel, un QR code" subtitle="Envoyez une requête, recevez l’image en PNG ou en SVG." />
        <p className="mt-8 text-center">
          <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm shadow-[0_8px_22px_rgba(23,23,26,0.06)]">
            <span className="rounded-md bg-forest px-2 py-0.5 text-xs font-bold tracking-wide text-white">POST</span>
            <code className="break-all font-mono text-ink">{`${BASE}/v1/qr`}</code>
          </span>
          <span className="mt-2 block text-sm text-sage">ou <code>GET</code> avec les mêmes paramètres dans l’adresse.</span>
        </p>
        <div className="mx-auto mt-8 max-w-3xl">
          <CodeTabs tabs={EXAMPLES} />
        </div>
      </Band>

      <Band id="types">
        <SectionHead title="Tous vos contenus" subtitle="Un type pour chaque usage : lien, Wi-Fi, appel, e-mail, position…" />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {TYPES.map(({ id, fields, premium, icon: Icon }) => (
            <li key={id} className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_10px_28px_rgba(23,23,26,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <span className="icon-tile h-11 w-11"><Icon className="h-5 w-5" /></span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${premium ? "premium-gold" : "bg-emerald-50 text-emerald-700"}`}>{premium ? "Premium" : "Gratuit"}</span>
              </div>
              <p className="mt-4 font-mono text-lg font-semibold text-forest">{id}</p>
              <p className="mt-1 text-sm leading-6 text-sage">{fields}</p>
            </li>
          ))}
        </ul>
      </Band>

      <Band id="options">
        <SectionHead title="Réglez le rendu" subtitle="Format, taille, couleurs : tout est facultatif." />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {OPTIONS.map(([o, v, d]) => (
            <li key={o} className="rounded-2xl border border-line bg-white p-5 shadow-[0_10px_28px_rgba(23,23,26,0.05)]">
              <p className="font-mono text-lg font-semibold text-forest">{o}</p>
              <p className="mt-2 text-sm leading-6 text-ink/80">{v}</p>
              <p className="mt-3 text-xs text-sage">Par défaut : <span className="rounded-md bg-cream-deep px-1.5 py-0.5 font-mono text-ink/80">{d}</span></p>
            </li>
          ))}
        </ul>
      </Band>

      <Band id="erreurs">
        <SectionHead title="Des erreurs lisibles" subtitle="Chaque refus renvoie un code et un message qui explique quoi corriger." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {ERRORS.map(([c, t, m]) => (
            <li key={c} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_10px_28px_rgba(23,23,26,0.05)]">
              <span className="rounded-xl bg-cream-deep px-3 py-2 font-mono text-xl font-bold text-forest">{c}</span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{t}</p>
                <p className="mt-1 text-sm leading-6 text-sage">{m}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-6 text-sage">Les QR codes générés par l’API sont statiques : ils fonctionnent sans Moncode et ne sont ni stockés ni modifiables.</p>
      </Band>

      {/* Appel à l'action final */}
      <section>
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:px-6 sm:pt-24">
          <h2 className="text-[clamp(2rem,7vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink">Prêt à générer ?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-sage">Créez votre clé gratuite en une minute.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/compte?onglet=cles-api" className="btn btn-primary w-full justify-center py-3.5 text-base sm:w-auto"><KeyRound className="h-4 w-4" /> Obtenir une clé</Link>
            <Link href="/contact" className="inline-flex items-center gap-1.5 py-2 text-[15px] font-semibold text-ink/80 transition hover:text-forest">Une question ? <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
