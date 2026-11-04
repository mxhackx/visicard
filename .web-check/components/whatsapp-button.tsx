import { MessageCircle } from "lucide-react";
import { whatsappUrl, CONTACT } from "@/lib/contact";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label={`Écrire sur WhatsApp au ${CONTACT.whatsappDisplay}`}
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-[#1fb355] sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
