import { redirect } from "next/navigation";

/** Ancienne étape « Intervention », retirée du parcours admin. */
export default function AdminNewPageRedirect() {
  redirect("/admin/nouveau/informations");
}
