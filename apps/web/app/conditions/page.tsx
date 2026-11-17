import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Conditions d’utilisation et de vente",
  description: "Les règles d’utilisation de Moncode : compte, Premium à 5 000 FCFA, paiement Mobile Money, contenus autorisés, responsabilités.",
  path: "/conditions",
});

const mail = <Link href="/contact">le formulaire de contact</Link>;

export default function Conditions() {
  return (
    <LegalPage
      title="Conditions d’utilisation et de vente"
      intro="En utilisant Moncode, vous acceptez ces conditions. Elles sont courtes et écrites pour être lues."
      updated="13 novembre 2026"
      current="/conditions"
      sections={[
        {
          title: "Le service",
          body: (
            <p>
              Moncode permet de créer des QR codes : un lien web (gratuit), ainsi que du texte, un Wi-Fi, une carte de visite, un téléphone, un SMS, un e-mail, un événement, une position GPS, une image, une vidéo, un PDF ou une page digitale. Les contenus hébergés (pages, images, vidéos, PDF) sont stockés par Moncode et s’ouvrent quand on scanne le QR code ; les autres contenus sont écrits dans le QR code lui-même.
            </p>
          ),
        },
        {
          title: "Votre compte",
          body: (
            <ul>
              <li>Un compte (Google ou e-mail) est nécessaire pour utiliser Premium et retrouver vos QR codes. Les informations fournies doivent être exactes (nom, e-mail, téléphone).</li>
              <li>Vous êtes responsable de la confidentialité de votre mot de passe et de l’usage de votre compte. En cas de perte, utilisez « Mot de passe oublié ».</li>
              <li>Un compte peut être suspendu en cas de fraude, d’abus ou de contenu interdit.</li>
            </ul>
          ),
        },
        {
          title: "Offre gratuite et Premium",
          body: (
            <>
              <ul>
                <li><strong>Gratuit</strong> : le QR code d’un lien web, avec les styles de base, sans compte. L’API développeurs est accessible gratuitement pour les liens, avec un quota mensuel.</li>
                <li><strong>Premium</strong> : <strong>5 000 FCFA</strong> pour <strong>un an</strong>. Il débloque tous les contenus, les couleurs, les formes, le logo, la création de pages digitales et l’API complète avec un quota élevé.</li>
              </ul>
              <p>Premium n’est pas un abonnement automatique : il ne se renouvelle pas tout seul. Un nouveau paiement avant la fin prolonge la durée d’un an. À l’échéance, vous ne pouvez plus créer de nouveaux QR codes premium tant que vous n’avez pas repayé ; <strong>vos QR codes déjà créés restent actifs</strong>.</p>
            </>
          ),
        },
        {
          title: "Prix et paiement",
          body: (
            <>
              <p>Les prix sont en francs CFA (XOF) et affichés avant tout paiement. Le règlement se fait par <strong>Mobile Money (MTN, Moov, Celtiis)</strong> via notre prestataire FeexPay : vous saisissez votre numéro, puis validez avec votre code secret sur votre téléphone. Moncode ne reçoit ni ne conserve ce code.</p>
              <p>Une facture ou un reçu est disponible dans votre espace, rubrique <Link href="/compte?onglet=factures">Factures</Link>. Des frais de l’opérateur peuvent s’appliquer selon votre réseau.</p>
            </>
          ),
        },
        {
          title: "Livraison, remboursement et rétractation",
          body: (
            <>
              <p>Le service étant numérique et activé immédiatement après le paiement, il est considéré comme fourni dès la confirmation. En conséquence, <strong>les paiements ne sont pas remboursables</strong>, sauf si le service n’a pas pu être fourni par notre faute (paiement débité sans activation de Premium, double paiement, défaut technique durable).</p>
              <p>Dans ces cas, écrivez-nous via {mail} avec la référence du paiement : nous corrigeons ou remboursons dans les meilleurs délais.</p>
            </>
          ),
        },
        {
          title: "Contenus autorisés et interdits",
          body: (
            <>
              <p>Vous êtes seul responsable de ce que vous mettez derrière vos QR codes et vous garantissez disposer des droits nécessaires (textes, photos, logos, fichiers). Sont interdits :</p>
              <ul>
                <li>les contenus illégaux, trompeurs, frauduleux (hameçonnage, fausses boutiques), diffamatoires, haineux ou violents ;</li>
                <li>les contenus pour adultes, ou portant atteinte aux mineurs ;</li>
                <li>les logiciels malveillants et les liens vers de tels contenus ;</li>
                <li>tout contenu portant atteinte aux droits d’un tiers (marque, droit d’auteur, vie privée).</li>
              </ul>
              <p>Nous pouvons refuser, masquer ou supprimer un contenu qui enfreint ces règles, sans préavis en cas d’abus grave.</p>
            </>
          ),
        },
        {
          title: "Vos QR codes imprimés",
          body: <p>Les QR codes « directs » (Wi-Fi, texte, lien, carte de visite…) contiennent leur information : ils fonctionnent sans Moncode et ne peuvent plus être modifiés une fois imprimés. Pour les pages, images, vidéos et PDF, le QR code ouvre une page hébergée par Moncode : nous mettons tout en œuvre pour qu’elle reste disponible, sans pouvoir garantir une disponibilité ininterrompue.</p>,
        },
        {
          title: "API développeurs",
          body: <p>L’accès à l’API se fait avec une clé personnelle, à ne pas partager. Les liens simples sont gratuits dans la limite du quota mensuel ; les autres contenus exigent Premium. Tout usage abusif (dépassement répété, contournement des limites, revente) peut entraîner la révocation de la clé. Voir la <Link href="/developpeurs">documentation</Link>.</p>,
        },
        {
          title: "Propriété intellectuelle",
          body: <p>Le site, la marque Moncode, les designs et le code sont la propriété de Moncode. Vous gardez tous vos droits sur vos contenus et nous accordez le droit de les héberger et de les afficher, le temps nécessaire au fonctionnement du service.</p>,
        },
        {
          title: "Responsabilité",
          body: <p>Moncode fournit le service avec soin, mais ne peut être tenu responsable des dommages indirects (perte de chiffre d’affaires, de clientèle) ni des interruptions dues à des tiers (opérateurs, hébergeurs, réseau, Mobile Money). Notre responsabilité est limitée, dans tous les cas, au montant que vous avez payé pour le service concerné.</p>,
        },
        {
          title: "Fin du compte",
          body: <p>Vous pouvez demander la suppression de votre compte à tout moment via {mail}. Nous pouvons clôturer un compte qui enfreint ces conditions. Les données sont alors traitées selon la <Link href="/confidentialite">politique de confidentialité</Link>.</p>,
        },
        {
          title: "Modifications, droit applicable",
          body: <p>Nous pouvons faire évoluer ces conditions ; la date de mise à jour figure en haut de la page et les changements importants vous sont signalés. Elles sont régies par le droit béninois. En cas de litige, nous cherchons d’abord une solution amiable ; à défaut, les tribunaux compétents de Cotonou sont seuls compétents.</p>,
        },
      ]}
    />
  );
}
