/* eslint-disable @next/next/no-img-element -- logo SVG statique de petite taille */
/** « Paiement sécurisé par FedaPay » avec le logo du prestataire. */
export default function FedapayBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs text-sage ${className}`}>
      Paiement sécurisé par
      <img src="/fedapay-logo.svg" alt="FedaPay" width={79} height={16} className="h-4 w-auto" />
    </span>
  );
}
