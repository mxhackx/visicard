import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import Header from "@/components/header";
import Footer from "@/components/footer";
import QrTypeBuilder from "@/components/qr/qr-type-builder";
import PageCreator from "@/components/page-builder/page-creator";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { isDirectQrType } from "@/lib/qr-payloads";

type Params = { type?: string | string[]; service?: string | string[] };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const wantedOf = (p: Params) => first(p.type) ?? first(p.service);

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  // Les étapes de la page digitale sont privées : jamais indexées.
  if (wantedOf(await searchParams) === "page") {
    return { title: "Votre page digitale", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: "Créer un QR code : lien gratuit, Wi-Fi, carte de visite, PDF, page digitale",
    description: "Créez un QR code gratuit pour un lien, choisissez le style et téléchargez-le en PNG et SVG. Premium à 5 000 FCFA pour tous les contenus, les couleurs et le logo.",
    path: "/creer",
  });
}

/**
 * Une seule page pour tout créer, le contenu se choisit dans l'adresse :
 *   /creer                         lien web (gratuit)
 *   /creer?type=wifi               Wi-Fi, carte de visite, téléphone, SMS, e-mail, texte, événement, GPS
 *   /creer?type=media | document   image ou vidéo | PDF
 *   /creer?type=page               page digitale (informations, apparence, création sur la même page)
 */
export default async function CreerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const wanted = wantedOf(params);

  let body: React.ReactNode;
  if (wanted === "page") {
    body = <PageCreator />;
  } else {
    const kind = wanted === "media" || wanted === "document" ? wanted : isDirectQrType(wanted) ? wanted : "url";
    body = <QrTypeBuilder type={kind} />;
  }

  return (
    <main className="min-h-screen">
      {wanted !== "page" && <JsonLd data={breadcrumbJsonLd([["Accueil", "/"], ["Créer un QR code", "/creer"]])} />}
      <Header />
      <div className="header-spacer"></div>
      {body}
      <Footer />
    </main>
  );
}
