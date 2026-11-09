import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** « Mon espace » ne montre que les QR codes créés : les pages annexes n'ont plus qu'un retour. */
export default function AccountNav() {
  return (
    <Link href="/compte" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> Mon espace
    </Link>
  );
}
