import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
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

const BASE = API_URL.startsWith("http://localhost") ? "https://api.moncode.app" : API_URL;

const TYPES: [string, string][] = [
  ["text", "data"],
  ["url", "data (http:// ou https://)"],
  ["wifi", "ssid, password, security (WPA, WEP, nopass), hidden"],
  ["tel", "phone"],
  ["sms", "phone, message"],
  ["email", "to, subject, body"],
  ["geo", "lat, lng"],
];

const OPTIONS: [string, string, string][] = [
  ["format", "png ou svg", "png"],
  ["size", "100 à 2000 (pixels)", "512"],
  ["margin", "0 à 10 (modules)", "2"],
  ["fg / bg", "couleurs hexadécimales, ex. #e3051d", "#111827 / #ffffff"],
  ["ecc", "L, M, Q ou H (correction d’erreur)", "M"],
  ["encoding", "json pour recevoir une data URL au lieu du fichier", "—"],
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-[#17171a] p-4 text-[13px] leading-6 text-white/90"><code>{children}</code></pre>
  );
}

export default function DeveloppeursPage() {
  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd([["Accueil", "/"], ["API développeurs", "/developpeurs"]])} />
      <Header />
      <div className="header-spacer"></div>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <p className="eyebrow">Développeurs</p>
        <h1 className="page-title mt-2">API Moncode</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-sage">
          Générez des QR codes (PNG ou SVG) depuis votre site ou votre application. Une requête HTTP, une image en retour.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/compte/cles-api" className="btn btn-primary"><KeyRound className="h-4 w-4" /> Obtenir une clé</Link>
          <a href="#exemples" className="btn btn-outline">Voir les exemples <ArrowRight className="h-4 w-4" /></a>
        </div>

        <h2 className="page-title mt-14">Quotas</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["1 000", "requêtes par mois et par clé"],
            ["30", "requêtes par minute et par clé"],
            ["5", "clés actives par compte"],
          ].map(([v, l]) => (
            <div key={l} className="surface p-5 text-center">
              <p className="text-3xl font-semibold text-forest">{v}</p>
              <p className="mt-1 text-sm text-sage">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-sage">
          Le quota se renouvelle le 1<sup>er</sup> de chaque mois (UTC). Au-delà, l’API répond <code>429</code> ; l’en-tête <code>Retry-After</code> indique quand réessayer.
          Besoin de plus ? <Link href="/contact" className="font-semibold text-forest hover:underline">Contactez-nous</Link>.
        </p>

        <h2 id="auth" className="page-title mt-14">Authentification</h2>
        <p className="mt-2 text-[15px] leading-7 text-sage">
          Créez une clé dans <Link href="/compte/cles-api" className="font-semibold text-forest hover:underline">votre espace</Link> et envoyez-la dans l’en-tête <code>X-API-Key</code> (ou <code>Authorization: Bearer …</code>).
          La clé n’est montrée qu’une fois : gardez-la côté serveur, jamais dans une page publique.
        </p>

        <h2 id="exemples" className="page-title mt-14">Générer un QR code</h2>
        <p className="mt-2 text-[15px] leading-7 text-sage"><code>POST {BASE}/v1/qr</code> (ou <code>GET</code> avec les mêmes paramètres dans l’URL)</p>
        <Code>{`curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"url","data":"https://moncode.app","fg":"#e3051d","size":600}' \\
  -o qr.png`}</Code>
        <p className="mt-6 text-sm font-semibold text-ink">Wi-Fi, en SVG</p>
        <Code>{`curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"wifi","ssid":"Moncode","password":"motdepasse","format":"svg"}' \\
  -o wifi.svg`}</Code>
        <p className="mt-6 text-sm font-semibold text-ink">JavaScript</p>
        <Code>{`const res = await fetch("${BASE}/v1/qr", {
  method: "POST",
  headers: { "X-API-Key": process.env.MONCODE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "url", data: "https://moncode.app", encoding: "json" }),
});
const { dataUrl } = await res.json(); // "data:image/png;base64,…"`}</Code>

        <h3 className="mt-10 text-base font-semibold text-ink">Types</h3>
        <div className="surface mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage"><tr><th className="px-4 py-3">type</th><th className="px-4 py-3">champs</th></tr></thead>
            <tbody>{TYPES.map(([t, f]) => <tr key={t} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-forest">{t}</td><td className="px-4 py-3 text-ink/80">{f}</td></tr>)}</tbody>
          </table>
        </div>

        <h3 className="mt-10 text-base font-semibold text-ink">Options</h3>
        <div className="surface mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage"><tr><th className="px-4 py-3">option</th><th className="px-4 py-3">valeurs</th><th className="px-4 py-3">défaut</th></tr></thead>
            <tbody>{OPTIONS.map(([o, v, d]) => <tr key={o} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-forest">{o}</td><td className="px-4 py-3 text-ink/80">{v}</td><td className="px-4 py-3 text-sage">{d}</td></tr>)}</tbody>
          </table>
        </div>

        <h2 className="page-title mt-14">Consulter votre consommation</h2>
        <p className="mt-2 text-[15px] leading-7 text-sage"><code>GET {BASE}/v1/usage</code> renvoie le quota du mois ; chaque réponse contient aussi <code>X-Quota-Remaining</code>.</p>
        <Code>{`{ "key": "Mon application", "unlimited": false, "perMinute": 30,
  "perMonth": 1000, "usedThisMonth": 12, "remainingThisMonth": 988 }`}</Code>

        <h2 className="page-title mt-14">Erreurs</h2>
        <ul className="mt-3 space-y-2 text-[15px] leading-7 text-sage">
          <li><code>400</code> paramètre manquant ou invalide (le message l’explique).</li>
          <li><code>401</code> clé absente, invalide ou révoquée.</li>
          <li><code>429</code> quota mensuel atteint ou trop de requêtes à la minute.</li>
        </ul>
        <p className="mt-6 text-sm text-sage">Les QR codes générés par l’API sont statiques : ils fonctionnent sans Moncode et ne sont ni stockés ni modifiables.</p>
      </section>
      <Footer />
    </main>
  );
}
