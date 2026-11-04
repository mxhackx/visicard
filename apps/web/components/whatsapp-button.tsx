import { MessageCircle } from "lucide-react";
import { whatsappUrl, CONTACT } from "@/lib/contact";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label={`Écrire sur WhatsApp au ${CONTACT.whatsappDisplay}`}
      className="group fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white shadow-[0_12px_30px_rgba(37,99,235,0.4)] ring-4 ring-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-forest-dark sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
