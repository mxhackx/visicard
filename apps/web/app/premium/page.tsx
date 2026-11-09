import { redirect } from "next/navigation";

/** Le passage en Premium se fait dans une fenêtre, sur la page de création. */
export default function PremiumPage() {
  redirect("/creer");
}
