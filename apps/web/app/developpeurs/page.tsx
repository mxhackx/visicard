import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gauge, KeyRound, QrCode, ShieldCheck, Zap } from "lucide-react";
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
    <div className="mt-3 max-lg:text-center">
      <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm">
        <span className="rounded-md bg-forest px-2 py-0.5 text-xs font-bold tracking-wide text-white">{method}</span>
        <code className="break-all font-mono text-ink">{children}</code>
      </p>
    </div>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="anchor mt-14 first:mt-0">
      <div className="flex flex-col items-center gap-2.5 text-center lg:flex-row lg:gap-3 lg:text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-semibold text-ambre-deep">{n}</span>
        <h2 className="page-title">{title}</h2>
      </div>
      <div className="mt-4 max-lg:[&>p]:text-center">{children}</div>
    </section>
  );
}

const TOC = [
  ["quotas", "Quotas"],
  ["exemples", "Générer un QR code"],
  ["types", "Types et options"],
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
      {/* Pas d'espaceur : le fond du hero passe derrière l'en-tête, qui est transparent (même fond, sans coupure). */}

      {/* En-tête : promesse, une action, et la requête en exemple avec sa réponse. */}
      <section className="relative overflow-hidden border-b border-line pt-[calc(var(--header-h)+1px)] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(227,5,29,0.09),transparent_70%),linear-gradient(#fff,#fbf5f5)] lg:bg-[radial-gradient(60%_80%_at_85%_0%,rgba(227,5,29,0.07),transparent_70%),linear-gradient(#fff,#fbf5f5)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-12 lg:px-8 lg:py-24">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/80 shadow-[0_4px_14px_rgba(23,23,26,0.06)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> API REST · PNG et SVG
            </span>
            <h1 className="mt-5 text-[clamp(2.4rem,11vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink lg:text-[3.4rem]">
              L’API <span className="text-forest">Moncode</span>
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-[17px] leading-7 text-sage sm:max-w-xl lg:mx-0">
              Une requête HTTP, un QR code en retour. Directement depuis votre site ou votre application.
            </p>

            <ul className="mt-6 flex justify-center gap-1 lg:hidden">
              {[
                [Zap, "Une requête"],
                [ShieldCheck, "Clé sécurisée"],
                [Gauge, "Quotas clairs"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Zap;
                return (
                  <li key={label as string} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-2 py-1.5 text-[11.5px] font-medium text-ink/80 ring-1 ring-line">
                    <I className="h-3.5 w-3.5 text-forest" /> {label as string}
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/compte/cles-api" className="btn btn-primary w-full justify-center py-3.5 text-base sm:w-auto"><KeyRound className="h-4 w-4" /> Obtenir une clé</Link>
              <a href="#exemples" className="inline-flex items-center gap-1.5 py-2 text-[15px] font-semibold text-ink/80 transition hover:text-forest">Voir les exemples <ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" /></a>
            </div>

            <ul className="mt-11 hidden gap-4 text-sm text-ink/80 lg:grid xl:grid-cols-3">
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

          <div className="min-w-0 text-left">
            <CodeBlock
              label="Requête"
              code={`curl -X POST ${BASE}/v1/qr \\
  -H "X-API-Key: mck_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"url",
       "data":"https://moncode.bj"}' \\
  -o qr.png`}
            />
            {/* La réponse, juste dessous : on comprend d'un coup d'œil ce que l'API renvoie. */}
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_8px_22px_rgba(23,23,26,0.07)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-deep text-ink"><QrCode className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">qr.png</p>
                <p className="truncate text-xs text-sage">image/png · 512 × 512 px</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">200 OK</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-8 lg:py-16">
        {/* Sommaire : barre défilante sur mobile, colonne collante sur ordinateur. */}
        <nav aria-label="Sommaire" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,#000_88%,transparent)] lg:[mask-image:none] lg:sticky lg:top-24 lg:mx-0 lg:block lg:space-y-1 lg:self-start lg:overflow-visible lg:px-0">
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

          <Section id="exemples" n="2" title="Générer un QR code">
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

          <Section id="types" n="3" title="Types et options">
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

          <Section id="erreurs" n="4" title="Erreurs">
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
