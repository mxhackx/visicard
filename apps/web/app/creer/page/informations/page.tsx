import { permanentRedirect } from "next/navigation";

/** Ancienne adresse : la page digitale se crée sur /creer?type=page. */
export default function Old() {
  permanentRedirect("/creer?type=page&etape=informations");
}
