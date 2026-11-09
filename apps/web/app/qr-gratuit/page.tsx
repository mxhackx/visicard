import { permanentRedirect } from "next/navigation";

/** Ancienne adresse : la création de QR code vit désormais sur /creer. */
export default function QrGratuitRedirect() {
  permanentRedirect("/creer");
}
