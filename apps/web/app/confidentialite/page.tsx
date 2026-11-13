import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/legal-page";
import { pageMetadata } from "@/lib/seo";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = pageMetadata({
  title: "Politique de confidentialité",
  description: "Quelles données Moncode collecte, pourquoi, combien de temps, avec qui elles sont partagées et comment exercer vos droits.",
  path: "/confidentialite",
});

const mail = <Link href="/contact">le formulaire de contact</Link>;

export default function Confidentialite() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Moncode crée des QR codes et des pages digitales. Voici, simplement, ce que nous savons de vous, pourquoi, et ce que vous pouvez en faire."
      updated="13 novembre 2026"
      current="/confidentialite"
      sections={[
        {
          title: "Qui est responsable de vos données",
          body: (
            <p>
              {CONTACT.brand}, basé à Cotonou (Bénin), est responsable du traitement des données décrites ci-dessous. Pour toute question sur vos données : écrivez-nous via {mail} ou sur WhatsApp au {CONTACT.whatsappDisplay}.
            </p>
          ),
        },
        {
          title: "Les données que nous collectons",
          body: (
            <ul>
              <li><strong>Votre compte</strong> : nom et prénom, adresse e-mail, numéro de téléphone, mot de passe (conservé sous forme chiffrée irréversible, jamais en clair) et, avec la connexion Google, votre photo de profil.</li>
              <li><strong>Vos QR codes</strong> : le contenu que vous y mettez (lien, texte, Wi-Fi, carte de visite, fichiers, photos, horaires, adresse de votre établissement…), leur style et leur date de création.</li>
              <li><strong>Vos paiements</strong> : montant, date, référence de la transaction et numéro Mobile Money utilisé. Nous ne voyons ni ne conservons jamais votre code secret.</li>
              <li><strong>Les scans de vos QR codes</strong> : date, type d’appareil (Android, iPhone, ordinateur) et localisation approximative (pays et ville). Votre adresse IP n’est jamais enregistrée.</li>
              <li><strong>Vos messages</strong> : ceux envoyés par le formulaire de contact, et les demandes (réservations, commandes) reçues via vos pages.</li>
            </ul>
          ),
        },
        {
          title: "Pourquoi nous les utilisons",
          body: (
            <ul>
              <li>Créer et afficher vos QR codes et vos pages, et vous permettre de les retrouver dans votre espace.</li>
              <li>Encaisser votre paiement Premium, émettre vos factures et vos reçus.</li>
              <li>Vous envoyer les e-mails utiles : lien de réinitialisation du mot de passe, QR code que vous demandez à vous envoyer, réponse à votre message.</li>
              <li>Vous montrer les statistiques de scans de vos QR codes.</li>
              <li>Protéger le service : limiter les abus et les robots, sécuriser les connexions.</li>
              <li>Respecter nos obligations légales (conservation des factures).</li>
            </ul>
          ),
        },
        {
          title: "Avec qui nous les partageons",
          body: (
            <>
              <p>Nous ne vendons jamais vos données. Elles ne sont partagées qu’avec les prestataires qui font fonctionner le service, chacun pour sa seule mission :</p>
              <ul>
                <li><strong>FeexPay</strong> : paiement Mobile Money (MTN, Moov, Celtiis). Il reçoit votre nom, votre e-mail et votre numéro pour traiter le paiement.</li>
                <li><strong>Vercel</strong> et <strong>Render</strong> : hébergement du site et de l’API.</li>
                <li><strong>Supabase</strong> : base de données et stockage de vos fichiers et photos.</li>
                <li><strong>Google</strong> : connexion avec votre compte Google, si vous la choisissez.</li>
                <li><strong>Resend</strong> : envoi des e-mails du service.</li>
                <li><strong>OpenStreetMap</strong> : carte affichée sur la page contact.</li>
              </ul>
              <p>Certains de ces prestataires sont situés hors du Bénin. Le contenu de vos pages publiques est, par nature, visible par toute personne qui scanne votre QR code.</p>
            </>
          ),
        },
        {
          title: "Combien de temps nous les gardons",
          body: (
            <ul>
              <li>Compte et QR codes : tant que votre compte existe. Sur simple demande, nous les supprimons.</li>
              <li>Factures et reçus de paiement : conservés pendant la durée légale d’archivage.</li>
              <li>Lien de réinitialisation du mot de passe : une heure.</li>
              <li>Messages de contact : le temps de vous répondre, puis au plus tard trois ans.</li>
              <li>Statistiques de scans : tant que le QR code correspondant existe.</li>
            </ul>
          ),
        },
        {
          title: "Cookies et stockage dans votre navigateur",
          body: (
            <>
              <p>Moncode n’utilise <strong>aucun cookie publicitaire ni de suivi</strong>. Seuls sont utilisés :</p>
              <ul>
                <li>des cookies de session sécurisés (inaccessibles au code de la page), strictement nécessaires pour rester connecté ;</li>
                <li>le stockage de session du navigateur, pour garder votre connexion et ce que vous saisissez pendant une création ; il disparaît à la fermeture de l’onglet ;</li>
                <li>le service Google, uniquement si vous choisissez de vous connecter avec Google : il dépose ses propres éléments, selon sa politique.</li>
              </ul>
              <p>Ces éléments étant nécessaires au service, ils ne demandent pas de consentement préalable.</p>
            </>
          ),
        },
        {
          title: "Vos droits",
          body: (
            <>
              <p>Vous pouvez à tout moment demander l’accès à vos données, leur rectification, leur suppression, leur portabilité, ou vous opposer à un traitement. Vous pouvez déjà modifier votre nom et votre téléphone dans <Link href="/compte?onglet=parametres">Mon espace → Paramètres</Link>.</p>
              <p>Pour le reste, écrivez-nous via {mail} : nous répondons sous 30 jours. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l’Autorité de protection des données personnelles (APDP) du Bénin, conformément au Code du numérique.</p>
            </>
          ),
        },
        {
          title: "Sécurité",
          body: <p>Les échanges sont chiffrés (HTTPS), les mots de passe sont protégés par un chiffrement irréversible, l’accès aux données est limité et les tentatives de connexion et d’envoi sont plafonnées pour freiner les abus. Aucun système n’étant infaillible, prévenez-nous si vous constatez un problème.</p>,
        },
        {
          title: "Mineurs",
          body: <p>Le service s’adresse aux personnes majeures ou autorisées par leur représentant légal. Nous ne collectons pas sciemment de données d’enfants.</p>,
        },
        {
          title: "Modifications de cette politique",
          body: <p>Nous pouvons la mettre à jour, par exemple si un nouveau prestataire intervient. La date de mise à jour figure en haut de la page ; en cas de changement important, nous vous prévenons par e-mail.</p>,
        },
      ]}
    />
  );
}
