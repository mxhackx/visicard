/* eslint-disable @next/next/no-img-element -- logo SVG statique de petite taille */
/** « Paiement sécurisé par FeexPay », avec le logo officiel du prestataire (feexpay.me). */
export default function FeexpayBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs text-sage ${className}`}>
      Paiement sécurisé par
      <img src="/payments/feexpay.svg" alt="FeexPay" width={72} height={16} className="h-4 w-auto" />
    </span>
  );
}
