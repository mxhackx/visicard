import { permanentRedirect } from "next/navigation";

/** Ancienne adresse : tout se crée sur /creer. */
export default function ChooseQrType() {
  permanentRedirect("/creer");
}
