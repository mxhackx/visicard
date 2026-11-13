import AuthButton from "@/components/account/auth-button";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Printer } from "lucide-react";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import Header from "@/components/header";
import Footer from "@/components/footer";
import TypeArt from "@/components/qr/type-art";
import { DIRECT_QR_TYPES } from "@/lib/qr-payloads";

export const metadata: Metadata = pageMetadata({
  title: "Manuel d’utilisation : créer et imprimer votre QR code",
  description: "Comment créer, payer, télécharger, modifier et imprimer votre QR code : lien gratuit, Wi-Fi, carte de visite, page digitale, image, vidéo ou PDF.",
  path: "/manuel",
});

const TOC = [
  ["demarrer", "Démarrer"],
  ["lien-gratuit", "QR code gratuit (lien)"],
  ["qr-direct", "QR codes directs"],
  ["page", "Page digitale"],
  ["media", "Image, vidéo, PDF"],
  ["compte", "Compte et paiement"],
  ["gerer", "Gérer votre activité"],
  ["modifier", "Modifier un QR code"],
  ["imprimer", "Imprimer et tester"],
  ["faq", "Questions fréquentes"],
] as const;

const FAQ = [
  ["Le QR code imprimé change-t-il si je modifie ma page ?", "Non. Le motif imprimé reste le même : seul le contenu en ligne change. Vous n’avez jamais à réimprimer."],
  ["Pourquoi un compte est-il demandé ?", "Pour les contenus mis en ligne (page, image, vidéo, PDF). Votre compte vous permet de retrouver votre QR code, vos factures et vos modifications depuis n’importe quel appareil."],
  ["Faut-il un compte pour un lien gratuit ou un QR direct ?", "Non. Le lien gratuit se télécharge sans compte. Les QR directs (Wi-Fi, carte de visite, appel…) se commandent sans compte."],
  ["Comment payer ?", "Par Mobile Money (MTN, Moov, Celtiis), dans un formulaire sécurisé par FeexPay : vous validez le paiement sur votre téléphone."],
  ["Comment savoir qu’un client m’a écrit ou réservé ?", "Une pastille rouge apparaît sur « Demandes » dans votre espace, avec le nombre de demandes à traiter. Vous pouvez aussi recevoir un e-mail à chaque nouvelle demande si l’équipe Moncode l’a activé."],
  ["Les statistiques sont-elles précises ?", "Elles comptent chaque ouverture de page, une fois par visite. La localisation est approximative (pays, parfois ville) et aucune adresse IP n’est conservée. Les QR codes directs (Wi-Fi, appel…) ne passent pas par Moncode et n’ont donc pas de statistiques."],
  ["Mon QR code direct peut-il être modifié ?", "Non : son contenu est écrit dans le QR code lui-même. Pour changer, commandez-en un nouveau."],
  ["Mon téléphone ne lit pas le QR code, que faire ?", "Vérifiez que le motif est foncé sur fond clair, imprimé assez grand (3 cm minimum) et net. Ouvrez l’appareil photo ou une application de scan à jour."],
] as const;

export default function ManuelPage() {
  return (
    <main className="min-h-screen">
      <JsonLd data={[breadcrumbJsonLd([["Accueil", "/"], ["Manuel d’utilisation", "/manuel"]]), faqJsonLd(FAQ.map(([q, a]) => [q, a] as [string, string]))]} />
      <Header />
      <div className="header-spacer"></div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="eyebrow">Manuel d’utilisation</p>
        <h1 className="page-title mt-3 max-w-3xl">
          Votre QR code, pas à pas
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-sage">
          Tout ce qu’il faut savoir pour créer, payer, télécharger, modifier et imprimer votre QR code.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="Sommaire" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:block lg:space-y-1 lg:self-start lg:overflow-visible lg:px-0">
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="shrink-0 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink/75 transition-colors hover:border-forest hover:text-forest lg:block lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3 lg:py-1.5 lg:hover:bg-cream"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="min-w-0 space-y-14">
            <Block id="demarrer" title="Démarrer">
              <p>Choisissez ce que votre QR code doit faire, remplissez deux ou trois informations, puis payez et téléchargez.</p>
              <Steps
                items={[
                  ["Choisissez", "Un simple lien, un Wi-Fi, une carte de visite, un appel… ou une page complète pour votre commerce."],
                  ["Remplissez", "Quelques champs seulement. L’aperçu se met à jour en direct sur téléphone, iPad et Mac."],
                  ["Payez et téléchargez", "Le prix s’affiche avant de payer. Dès la confirmation, votre QR code est prêt (PNG et SVG)."],
                ]}
              />
              <Cta href="/creer" label="Créer un QR code" />
            </Block>

            <Block id="lien-gratuit" title="QR code gratuit (lien)">
              <p>Pour un simple lien web (site, menu en ligne, page Facebook…), c’est gratuit et sans compte.</p>
              <List
                items={[
                  "Collez l’adresse du lien.",
                  "Choisissez les couleurs et les formes. Un logo peut être ajouté au centre.",
                  "Téléchargez le QR code en PNG (écran, réseaux) ou SVG (impression).",
                ]}
              />
              <p className="text-sm text-sage">Un lien encodé de cette façon ne peut plus être modifié une fois imprimé.</p>
              <Cta href="/creer" label="Générer un lien gratuit" />
            </Block>

            <Block id="qr-direct" title="QR codes directs">
              <p>Le contenu est inscrit dans le QR code : le téléphone agit dès le scan, sans passer par Moncode. Choisissez le type, voyez l’aperçu, puis commandez.</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {DIRECT_QR_TYPES.filter((t) => t.id !== "url").map((t) => (
                  <li key={t.id}>
                    <Link href={`/creer?type=${t.id}`} className="surface surface-hover flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
                      <TypeArt type={t.id} className="h-12 w-12 shrink-0" />
                      <span>
                        <span className="block font-semibold text-ink">{t.label}</span>
                        <span className="block text-xs text-sage">{t.hint}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-sage">Aucun compte n’est nécessaire. Le contenu est écrit dans le QR code : il ne se modifie pas après impression.</p>
            </Block>

            <Block id="page" title="Page digitale">
              <p>Une page mobile pour votre commerce (menu, photos, horaires, WhatsApp, itinéraire), accessible en un scan.</p>
              <Steps
                items={[
                  ["Votre activité", "Choisissez votre secteur : les questions et le style de page s’adaptent."],
                  ["L’essentiel", "Nom, numéro WhatsApp, ce que vous proposez (un modèle de texte est proposé), logo ou photo."],
                  ["Plus de détails (facultatif)", "Adresse (recherche automatique), horaires, photos du lieu, réseaux sociaux."],
                  ["Apparence", "Choisissez un style et vos couleurs ; l’aperçu s’affiche sur mobile, iPad et ordinateur."],
                  ["Paiement", "Créez votre compte si besoin, payez : votre page et votre QR code sont activés."],
                ]}
              />
              <Cta href="/creer?type=page" label="Créer ma page" />
            </Block>

            <Block id="media" title="Image, vidéo, PDF">
              <p>Un fichier hébergé par Moncode, ouvert sur une page de lecture légère quand on scanne le QR code.</p>
              <List
                items={[
                  "Image : JPG, PNG ou WEBP. Vidéo courte acceptée.",
                  "Document : un fichier PDF (carte, brochure, fiche technique).",
                  "Un QR code par fichier. Vous pouvez remplacer le fichier plus tard sans réimprimer.",
                ]}
              />
              <Cta href="/creer" label="Choisir mon contenu" />
            </Block>

            <Block id="compte" title="Compte et paiement">
              <List
                items={[
                  "Un compte est demandé pour tout contenu mis en ligne (page, image, vidéo, PDF) : nom, e-mail, mot de passe, au moment de payer.",
                  "Le lien gratuit et les QR directs se passent de compte.",
                  "Paiement par Mobile Money ou carte sur une page sécurisée. Le prix s’affiche juste avant le bouton « Payer ».",
                  "Votre facture et votre QR code sont dans « Mon compte », pour toujours.",
                ]}
              />
              <div className="flex flex-wrap gap-3">
                <AuthButton mode="register" label="Créer mon compte" />
                <AuthButton mode="login" label="J’ai déjà un compte" />
              </div>
            </Block>

            <Block id="gerer" title="Gérer votre activité (sans devis)">
              <p className="text-sm leading-6 text-ink/80">Depuis « Mon compte », ouvrez un QR code de type page digitale puis « Gérer » : tout se modifie en direct, gratuitement.</p>
              <List
                items={[
                  "Statistiques : nombre de scans, heures de consultation, appareils et pays des visiteurs. L’onglet « Performances » compare tous vos QR codes.",
                  "Promotion : un bandeau en haut de la page, qui disparaît tout seul à la date de fin.",
                  "Catalogue : jusqu’à 60 produits ou services avec prix et photo, à changer quand vous voulez.",
                  "Réservations, commandes ou messages : le visiteur vous écrit après le scan. Retrouvez-les dans « Demandes » et répondez par appel ou WhatsApp.",
                  "Plusieurs établissements : créez-les dans « Établissements », puis rattachez chaque QR code au bon.",
                  "Carte de visite numérique : choisissez le secteur « Profil professionnel » pour un profil avec appel, WhatsApp et contact à enregistrer.",
                ]}
              />
            </Block>

            <Block id="modifier" title="Modifier un QR code">
              <List
                items={[
                  "Ouvrez « Mon compte », puis le QR code concerné.",
                  "Choisissez « Modifier », changez le texte, les photos ou le fichier.",
                  "Les changements sont en ligne après confirmation du paiement de la modification.",
                  "Le QR code déjà imprimé ne change jamais : seul son contenu évolue.",
                ]}
              />
            </Block>

            <Block id="imprimer" title="Imprimer et tester">
              <div className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
                <Printer className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
                <p className="text-sm leading-6 text-ink/80">Téléchargez le SVG pour l’impression : il reste net à toutes les tailles.</p>
              </div>
              <List
                items={[
                  "Taille minimale : 3 cm de côté (davantage pour un affichage vu de loin).",
                  "Motif foncé sur fond clair : évitez les couleurs claires ou inversées.",
                  "Laissez une marge blanche autour du QR code.",
                  "Testez toujours le scan avec deux téléphones avant d’imprimer en grand nombre.",
                ]}
              />
            </Block>

            <Block id="faq" title="Questions fréquentes">
              <div className="divide-y divide-line rounded-2xl border border-line bg-white">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                      {q}
                      <span className="text-forest transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-sage">{a}</p>
                  </details>
                ))}
              </div>
              <p className="text-sm text-sage">
                Une autre question ? <Link href="/contact" className="font-semibold text-forest underline-offset-4 hover:underline">Contactez-nous</Link>.
              </p>
            </Block>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="anchor space-y-4 text-[15px] leading-7 text-ink/80">
      <h2 className="page-title">{title}</h2>
      {children}
    </section>
  );
}

function Steps({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ol className="space-y-3">
      {items.map(([t, d], i) => (
        <li key={t} className="flex gap-4 rounded-xl bg-white p-4 ring-1 ring-line">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">{i + 1}</span>
          <span>
            <span className="block font-semibold text-ink">{t}</span>
            <span className="block text-sm leading-6 text-sage">{d}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it} className="flex gap-3">
          <Check className="mt-1 h-4 w-4 shrink-0 text-forest" /> {it}
        </li>
      ))}
    </ul>
  );
}

function Cta({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="btn btn-primary btn-sm">
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
