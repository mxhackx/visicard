/**
 * Grille tarifaire, en FCFA (XOF). C'est la seule source de vérité : le montant
 * d'un devis est toujours calculé ici, jamais reçu du navigateur.
 */
export type ServiceType = 'page' | 'media' | 'document';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  page: 'Page digitale',
  media: 'QR image ou vidéo',
  document: 'QR document PDF',
};

export const CREATION_PRICES: Record<ServiceType, number> = {
  page: 20000,
  media: 5000,
  document: 5000,
};

/** À VALIDER : prix d'une modification de contenu après mise en ligne. */
export const MODIFICATION_PRICES: Record<ServiceType, number> = {
  page: 5000,
  media: 2500,
  document: 2500,
};

export interface OrderItem {
  label: string;
  quantity: number;
  unitPrice: number;
}

export function isServiceType(value: unknown): value is ServiceType {
  return value === 'page' || value === 'media' || value === 'document';
}

export function itemsFor(kind: 'creation' | 'modification', service: ServiceType): OrderItem[] {
  if (kind === 'creation') {
    return [
      { label: `${SERVICE_LABELS[service]} : création, hébergement et QR code`, quantity: 1, unitPrice: CREATION_PRICES[service] },
    ];
  }
  return [{ label: `${SERVICE_LABELS[service]} : modification du contenu`, quantity: 1, unitPrice: MODIFICATION_PRICES[service] }];
}

export function totalOf(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
