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

/**
 * Envoie à son propriétaire le QR code qu'il vient de demander (pièce jointe PNG), via Resend.
 * Renvoie `false` quand le service d'e-mail n'est pas configuré (RESEND_API_KEY) ou refuse l'envoi.
 */
export async function sendQrToOwner(email: string, input: { title: string; target: string; pngDataUrl: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return false;
  const base64 = input.pngDataUrl.replace(/^data:image\/png;base64,/, '');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Moncode <notifications@moncode.app>',
        to: [email],
        subject: `Votre QR code : ${input.title}`,
        html: `<p>Voici votre QR code <strong>${esc(input.title)}</strong>, en pièce jointe (PNG).</p><p>Contenu : ${esc(input.target)}</p><p>Retrouvez tous vos QR codes dans votre espace Moncode.</p>`,
        attachments: [{ filename: 'qr-code.png', content: base64 }],
      }),
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { message?: string };
      logger.warn(`Envoi du QR refusé (${res.status}) : ${detail.message ?? 'sans détail'}`);
    }
    return res.ok;
  } catch (error) {
    logger.warn(`Envoi du QR impossible : ${(error as Error).message}`);
    return false;
  }
}

export interface ContactMessage {
  name: string;
  business?: string;
  email: string;
  phone: string;
  kind?: string;
  message: string;
}

/**
 * Transmet à l'équipe un message du formulaire de contact (destinataire : CONTACT_TO, sinon l'adresse de l'administrateur ADMIN_EMAIL).
 * L'adresse du visiteur est mise en « répondre à » : il suffit de répondre pour lui écrire.
 */
export async function sendContactMessage(m: ContactMessage): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'Le service d’envoi n’est pas configuré (RESEND_API_KEY).' };
  const to = process.env.CONTACT_TO || process.env.ADMIN_EMAIL || '';
  if (!to) return { ok: false, reason: 'Aucun destinataire configuré (CONTACT_TO).' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Moncode <notifications@moncode.app>',
        to: [to],
        reply_to: m.email,
        subject: `Contact Moncode : ${m.name}${m.business ? ` (${m.business})` : ''}`,
        html: `<p><strong>${esc(m.name)}</strong>${m.business ? ` · ${esc(m.business)}` : ''}${m.kind ? ` · ${esc(m.kind)}` : ''}</p><p>E-mail : ${esc(m.email)}<br>Téléphone : ${esc(m.phone)}</p><p style="white-space:pre-wrap">${esc(m.message)}</p>`,
      }),
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { message?: string };
      logger.warn(`Message de contact refusé (${res.status}) : ${detail.message ?? 'sans détail'}`);
      return { ok: false, reason: 'L’envoi a été refusé par le service e-mail.' };
    }
    return { ok: true };
  } catch (error) {
    logger.warn(`Message de contact impossible : ${(error as Error).message}`);
    return { ok: false, reason: 'Le service e-mail ne répond pas.' };
  }
}

/** Lien « mot de passe oublié » (valable une heure). Renvoie `false` sans service e-mail configuré ou en cas de refus. */
export async function sendPasswordReset(email: string, name: string | null | undefined, link: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Moncode <notifications@moncode.app>',
        to: [email],
        subject: 'Réinitialisez votre mot de passe Moncode',
        html: `<p>Bonjour${name ? ` ${esc(name)}` : ''},</p><p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable <strong>une heure</strong> :</p><p><a href="${esc(link)}">Choisir un nouveau mot de passe</a></p><p>Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>`,
      }),
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { message?: string };
      logger.warn(`Envoi du lien de réinitialisation refusé (${res.status}) : ${detail.message ?? 'sans détail'}`);
    }
    return res.ok;
  } catch (error) {
    logger.warn(`Envoi du lien de réinitialisation impossible : ${(error as Error).message}`);
    return false;
  }
}
