import Link from "next/link";
import Logo from "@/components/logo";

/** Barre minimale des pages de l'espace compte : ni l'en-tête ni le pied de page du site ici,
    juste le logo pour revenir au site, sur un filet qui sépare du contenu. */
export default function AccountTopBar() {
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
          <Logo variant="dark" />
        </Link>
      </div>
    </div>
  );
}
