import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gauge, KeyRound, ShieldCheck, Zap } from "lucide-react";
import CodeBlock from "@/components/code-block";
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

const TYPES: [string, string][] = [
  ["url", "data (http:// ou https://) · gratuit"],
  ["text", "data · Premium"],
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

function Code({ children, label = "Exemple" }: { children: string; label?: string }) {
  return <CodeBlock code={children} label={label} className="mt-3" />;
}

function Endpoint({ method, children }: { method: string; children: string }) {
  return (
    <p className="mt-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm">
      <span className="rounded-md bg-forest px-2 py-0.5 text-xs font-bold tracking-wide text-white">{method}</span>
      <code className="break-all font-mono text-ink">{children}</code>
    </p>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="anchor mt-14 first:mt-0">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-semibold text-ambre-deep">{n}</span>
        <h2 className="page-title">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const TOC = [
  ["quotas", "Quotas"],
  ["auth", "Authentification"],
  ["exemples", "Générer un QR code"],
  ["types", "Types et options"],
  ["usage", "Consommation"],
  ["erreurs", "Erreurs"],
];

const ERRORS: [string, string][] = [
  ["400", "Paramètre manquant ou invalide (le message l’explique)."],
  ["401", "Clé absente, invalide ou révoquée."],
  ["402", "Contenu réservé aux comptes Premium (tout sauf les liens)."],
  ["429", "Quota mensuel atteint ou trop de requêtes à la minute."],
];

export default function DeveloppeursPage() {
  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd([["Accueil", "/"], ["API développeurs", "/developpeurs"]])} />
      <Header />
      <div className="header-spacer"></div>

      {/* En-tête : promesse, deux actions, et la requête en exemple. */}
      <section className="border-b border-line bg-[radial-gradient(60%_80%_at_85%_0%,rgba(227,5,29,0.07),transparent_70%),linear-gradient(#fff,#fbf5f5)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_minmax(0,520px)] lg:px-8 lg:py-16">
          <div>
            <p className="eyebrow">Développeurs</p>
            <h1 className="page-title mt-2">API Moncode</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-sage">
              Générez des QR codes (PNG ou SVG) depuis votre site ou votre application. Une requête HTTP, une image en retour.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/compte/cles-api" className="btn btn-primary"><KeyRound className="h-4 w-4" /> Obtenir une clé</Link>
              <a href="#exemples" className="btn btn-outline">Voir les exemples <ArrowRight className="h-4 w-4" /></a>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-ink/80 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                [Zap, "Une seule requête"],
                [ShieldCheck, "Clé API sécurisée"],
                [Gauge, "Quotas clairs"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Zap;
                return (
                  <li key={label as string} className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-forest ring-1 ring-line"><I className="h-4 w-4" /></span>
                    {label as string}
                  </li>
                );
              })}
            </ul>
          </div>
          <CodeBlock
            label="Terminal"
            code={`curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"url","data":"https://moncode.bj"}' \\
  -o qr.png`}
          />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-8 lg:py-16">
        {/* Sommaire : barre défilante sur mobile, colonne collante sur ordinateur. */}
        <nav aria-label="Sommaire" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:block lg:space-y-1 lg:self-start lg:overflow-visible lg:px-0">
          {TOC.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink/75 transition hover:border-forest hover:text-forest lg:block lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3 lg:py-1.5 lg:hover:bg-cream-deep">
              {label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 max-w-3xl">
          <Section id="quotas" n="1" title="Quotas">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["1 000", "requêtes gratuites par mois (liens simples)"],
                ["50 000", "requêtes par mois avec Premium (tous les contenus)"],
                ["5", "clés actives par compte"],
              ].map(([v, l]) => (
                <div key={l} className="surface p-5 text-center">
                  <p className="text-3xl font-semibold text-forest">{v}</p>
                  <p className="mt-1 text-sm text-sage">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-sage">
              La clé est gratuite et les liens (<code>type=url</code>) le sont aussi. Tous les autres contenus (Wi-Fi, téléphone, SMS, e-mail, texte, GPS…) exigent un compte <strong>Premium</strong> (5 000 FCFA) : sinon l’API répond <code>402</code>.
              Le quota se renouvelle le 1<sup>er</sup> de chaque mois (UTC). Au-delà, l’API répond <code>429</code> ; l’en-tête <code>Retry-After</code> indique quand réessayer.
              Besoin de plus ? <Link href="/contact" className="font-semibold text-forest hover:underline">Contactez-nous</Link>.
            </p>
          </Section>

          <Section id="auth" n="2" title="Authentification">
            <p className="text-[15px] leading-7 text-sage">
              Créez une clé dans <Link href="/compte/cles-api" className="font-semibold text-forest hover:underline">votre espace</Link> et envoyez-la dans l’en-tête <code>X-API-Key</code> (ou <code>Authorization: Bearer …</code>).
            </p>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              La clé n’est montrée qu’une fois : gardez-la côté serveur, jamais dans une page publique.
            </p>
          </Section>

          <Section id="exemples" n="3" title="Générer un QR code">
            <Endpoint method="POST">{`${BASE}/v1/qr`}</Endpoint>
            <p className="mt-2 text-sm text-sage">ou <code>GET</code> avec les mêmes paramètres dans l’URL.</p>
            <p className="mt-6 text-sm font-semibold text-ink">Lien, en PNG</p>
            <Code label="curl">{`curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"url","data":"https://moncode.bj","fg":"#e3051d","size":600}' \\
  -o qr.png`}</Code>
            <p className="mt-6 text-sm font-semibold text-ink">Wi-Fi, en SVG</p>
            <Code label="curl">{`curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"wifi","ssid":"Moncode","password":"motdepasse","format":"svg"}' \\
  -o wifi.svg`}</Code>
            <p className="mt-6 text-sm font-semibold text-ink">JavaScript</p>
            <Code label="JavaScript">{`const res = await fetch("${BASE}/v1/qr", {
  method: "POST",
  headers: { "X-API-Key": process.env.MONCODE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "url", data: "https://moncode.bj", encoding: "json" }),
});
const { dataUrl } = await res.json(); // "data:image/png;base64,…"`}</Code>
          </Section>

          <Section id="types" n="4" title="Types et options">
            <h3 className="text-base font-semibold text-ink">Types</h3>
            <div className="surface mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage"><tr><th className="px-4 py-3">type</th><th className="px-4 py-3">champs</th></tr></thead>
                <tbody>{TYPES.map(([t, f]) => <tr key={t} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-forest">{t}</td><td className="px-4 py-3 text-ink/80">{f}</td></tr>)}</tbody>
              </table>
            </div>
            <h3 className="mt-8 text-base font-semibold text-ink">Options</h3>
            <div className="surface mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage"><tr><th className="px-4 py-3">option</th><th className="px-4 py-3">valeurs</th><th className="px-4 py-3">défaut</th></tr></thead>
                <tbody>{OPTIONS.map(([o, v, d]) => <tr key={o} className="border-b border-line last:border-0"><td className="px-4 py-3 font-mono text-forest">{o}</td><td className="px-4 py-3 text-ink/80">{v}</td><td className="px-4 py-3 text-sage">{d}</td></tr>)}</tbody>
              </table>
            </div>
          </Section>

          <Section id="usage" n="5" title="Consulter votre consommation">
            <Endpoint method="GET">{`${BASE}/v1/usage`}</Endpoint>
            <p className="mt-2 text-[15px] leading-7 text-sage">Renvoie le quota du mois ; chaque réponse contient aussi <code>X-Quota-Remaining</code>.</p>
            <Code label="Réponse JSON">{`{ "key": "Mon application", "unlimited": false, "perMinute": 30,
  "perMonth": 1000, "usedThisMonth": 12, "remainingThisMonth": 988 }`}</Code>
          </Section>

          <Section id="erreurs" n="6" title="Erreurs">
            <ul className="surface divide-y divide-line overflow-hidden">
              {ERRORS.map(([c, m]) => (
                <li key={c} className="flex items-start gap-4 px-4 py-3.5 text-[15px] leading-6">
                  <span className="mt-0.5 rounded-md bg-cream-deep px-2 py-0.5 font-mono text-sm font-semibold text-forest">{c}</span>
                  <span className="text-ink/80">{m}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-sage">Les QR codes générés par l’API sont statiques : ils fonctionnent sans Moncode et ne sont ni stockés ni modifiables.</p>
          </Section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
