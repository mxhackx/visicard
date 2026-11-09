import { permanentRedirect } from "next/navigation";

/** Ancienne adresse : le type se choisit désormais dans /creer?type=… */
export default async function QrTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  permanentRedirect(type === "url" ? "/creer" : `/creer?type=${encodeURIComponent(type)}`);
}
