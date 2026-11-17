import { redirect } from "next/navigation";

/** La gestion des clés vit désormais dans « Mon espace », onglet Clés d'API. */
export default function ClesApiPage() {
  redirect("/compte?onglet=cles-api");
}
