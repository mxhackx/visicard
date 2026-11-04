import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const essentialIncluded = [
  "1 établissement, menu illimité (plats, photos, prix, horaires)",
  "Page publique accessible par QR code, sans application",
  "QR code vectoriel + planche prête à imprimer",
  "Modifications à volonté, en direct",
  "Bouton WhatsApp sur la carte",
  "Hébergement et support inclus la première année",
];

const customIncluded = [
  "Plusieurs établissements, enseignes ou points de vente",
  "Charte graphique avancée et reprise de votre domaine",
  "Cartes événement, menus nominatifs, langues multiples",
  "Intégrations (caisse, réservation, Google Maps)",
  "Formation de votre équipe et accompagnement dans la durée",
];

export default function PricingSection() {
  return (
    <section id="tarifs" className="scroll-mt-16 border-b border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Tarifs</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Une offre claire, une offre sur devis
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Vous choisissez selon votre périmètre : un seul établissement, ou un groupe à équiper.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900">Carte digitale</h3>
            <p className="mt-1 text-sm text-slate-600">
              Pour un restaurant, un salon, une boutique ou un cabinet.
            </p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-slate-900">20 000</span>
              <span className="text-lg font-semibold text-slate-900">FCFA</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Paiement unique. Pas d'abonnement, pas de commission sur vos ventes.
            </p>

            <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
              {essentialIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Créer ma carte
              </Link>
              <a
                href={whatsappUrl(
                  "Bonjour Moncode, je souhaite la carte digitale à 20 000 FCFA.",
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                Poser une question
              </a>
            </div>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900">Sur mesure</h3>
            <p className="mt-1 text-sm text-slate-600">
              Pour les groupes, franchises, agences et événements.
            </p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-slate-900">Sur devis</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Chiffré après un échange de 15 minutes sur vos besoins réels.
            </p>

            <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
              {customIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Demander un devis
              </Link>
              <a
                href={whatsappUrl(
                  "Bonjour Moncode, nous voulons équiper plusieurs établissements. Pouvons-nous parler d'un devis ?",
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp pro
              </a>
            </div>
          </article>
        </div>

        <p className="mt-8 text-sm leading-6 text-slate-500">
          Paiement par Mobile Money ou virement. Facture établie à votre nom. Le passage d'une offre
          à l'autre se fait sans perdre vos QR codes déjà imprimés.
        </p>
      </div>
    </section>
  );
}
