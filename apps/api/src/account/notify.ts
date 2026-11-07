import { Logger } from '@nestjs/common';

const logger = new Logger('Notifications');
const LABEL: Record<string, string> = { booking: 'réservation', order: 'commande', contact: 'message' };

interface Notice {
  kind: string;
  name: string;
  phone: string;
  message: string | null;
  details?: unknown;
  title: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * Prévient le propriétaire d'une nouvelle demande par e-mail (service Resend).
 * Sans `RESEND_API_KEY`, rien n'est envoyé : la demande reste visible dans l'espace client.
 */
export async function notifyOwner(email: string | null | undefined, n: Notice): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return;
  const app = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const label = LABEL[n.kind] ?? 'demande';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Moncode <notifications@moncode.app>',
        to: [email],
        subject: `Nouvelle ${label} : ${n.title}`,
        html: `<p>Nouvelle <strong>${label}</strong> de <strong>${esc(n.name)}</strong> (${esc(n.phone)}) pour « ${esc(n.title)} ».</p>${n.message ? `<p>${esc(n.message)}</p>` : ''}<p><a href="${app}/compte/demandes">Ouvrir mes demandes</a></p>`,
      }),
    });
    if (!res.ok) logger.warn(`Envoi refusé (${res.status})`);
  } catch (error) {
    logger.warn(`Envoi impossible : ${(error as Error).message}`);
  }
}
