import type { Metadata } from "next";
import LegalPage from "@/components/legal/legal-page";
import { pageMetadata } from "@/lib/seo";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = pageMetadata({
  title: "Mentions légales",
  description: "Éditeur, direction de la publication, hébergeurs et contact du site Moncode.",
  path: "/mentions-legales",
});

export default function MentionsLegales() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Les informations d’identification du site moncode, de son éditeur et de ses hébergeurs."
      updated="13 novembre 2026"
      current="/mentions-legales"
      sections={[
        {
          title: "Éditeur du site",
          body: (
            <ul>
              <li>Nom : {CONTACT.brand}</li>
              <li>Localisation : Cotonou, Bénin</li>
              <li>Contact : <a href="/contact">formulaire de contact du site</a></li>
              <li>Téléphone et WhatsApp : {CONTACT.whatsappDisplay}</li>
              <li>Horaires : {CONTACT.hours}</li>
            </ul>
          ),
        },
        {
          title: "Direction de la publication",
          body: <p>Fondateurs : Carmel TINHOUINTIN (développeur web) et Mateo GRAND (PDG). Le directeur de la publication est Mateo GRAND.</p>,
        },
        {
          title: "Hébergement et prestataires techniques",
          body: (
            <ul>
              <li>Site web : <a href="https://vercel.com" rel="noreferrer" target="_blank">Vercel Inc.</a></li>
              <li>API et services : <a href="https://render.com" rel="noreferrer" target="_blank">Render</a></li>
              <li>Base de données et fichiers : <a href="https://supabase.com" rel="noreferrer" target="_blank">Supabase</a></li>
              <li>Paiements Mobile Money : <a href="https://feexpay.me" rel="noreferrer" target="_blank">FeexPay</a></li>
              <li>E-mails du service : <a href="https://resend.com" rel="noreferrer" target="_blank">Resend</a></li>
            </ul>
          ),
        },
        {
          title: "Propriété intellectuelle",
          body: <p>La marque, le logo, les textes, les designs et le code de Moncode sont protégés. Toute reproduction sans autorisation est interdite. Les logos MTN, Moov Africa, Celtiis et FeexPay appartiennent à leurs propriétaires respectifs et ne sont utilisés que pour indiquer les moyens de paiement acceptés.</p>,
        },
        {
          title: "Contenus des utilisateurs",
          body: <p>Les pages, images, vidéos et fichiers accessibles par un QR code sont publiés par les utilisateurs, sous leur responsabilité. Pour signaler un contenu illicite, écrivez-nous par le <a href="/contact">formulaire de contact</a> ou sur WhatsApp en indiquant l’adresse de la page : nous l’examinons rapidement et la retirons si nécessaire.</p>,
        },
        {
          title: "Données personnelles",
          body: <p>Le traitement des données personnelles est décrit dans la <a href="/confidentialite">politique de confidentialité</a>. Les règles d’utilisation du service figurent dans les <a href="/conditions">conditions d’utilisation et de vente</a>.</p>,
        },
        {
          title: "Droit applicable",
          body: <p>Le site est soumis au droit béninois. Les tribunaux compétents de Cotonou sont seuls compétents, sous réserve des règles impératives applicables.</p>,
        },
      ]}
    />
  );
}
