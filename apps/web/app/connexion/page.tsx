import { redirect } from "next/navigation";

/** La connexion se fait dans une fenêtre : « Mon espace » l'ouvre si besoin. */
export default function ConnexionPage() {
  redirect("/compte");
}
