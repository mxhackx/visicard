import { Logger } from '@nestjs/common';
import { primaryAppUrl } from '../app-url';

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

const BRAND = '#e3051d';

/** Modèle d'e-mail commun : logo Moncode, titre, corps, bouton facultatif et pied de page (styles en ligne, compatibles messageries). */
function emailLayout(o: { title: string; intro?: string; bodyHtml?: string; button?: { label: string; href: string }; note?: string; preheader?: string }): string {
  const app = primaryAppUrl();
  const button = o.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px"><tr><td style="border-radius:10px;background:${BRAND}"><a href="${esc(o.button.href)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${esc(o.button.label)}</a></td></tr></table>`
    : '';
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f6f1f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17171a">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader ?? o.title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1f1;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #ece4e4;overflow:hidden">
<tr><td style="padding:28px 32px 0"><a href="${esc(app)}" style="text-decoration:none"><img src="${esc(app)}/logo.png" width="44" height="44" alt="Moncode" style="vertical-align:middle;border-radius:10px;border:0"><span style="vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#17171a">Moncode</span></a></td></tr>
<tr><td style="padding:24px 32px 32px">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#17171a">${esc(o.title)}</h1>
${o.intro ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#4a4a52">${o.intro}</p>` : ''}
${button}
${o.bodyHtml ?? ''}
${o.note ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#7a7a84">${o.note}</p>` : ''}
</td></tr>
<tr><td style="padding:18px 32px;background:#faf6f6;border-top:1px solid #ece4e4;font-size:12px;line-height:1.6;color:#7a7a84">Moncode · QR codes et pages digitales · Cotonou, Bénin<br><a href="${esc(app)}" style="color:${BRAND};text-decoration:none">moncode.bj</a></td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Prévient le propriétaire d'une nouvelle demande par e-mail (service Resend).
 * Sans `RESEND_API_KEY`, rien n'est envoyé : la demande reste visible dans l'espace client.
 */
export async function notifyOwner(email: string | null | undefined, n: Notice): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return;
  const app = primaryAppUrl();
  const label = LABEL[n.kind] ?? 'demande';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Moncode <no-reply@moncode.bj>',
        to: [email],
        subject: `Nouvelle ${label} : ${n.title}`,
        html: emailLayout({
          title: `Nouvelle ${label}`,
          preheader: `${n.name} · ${n.title}`,
          intro: `<strong>${esc(n.name)}</strong> (${esc(n.phone)}) pour « ${esc(n.title)} ».`,
          bodyHtml: n.message ? `<p style="margin:16px 0 0;padding:12px 14px;background:#faf6f6;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(n.message)}</p>` : '',
          button: { label: 'Ouvrir mes demandes', href: `${app}/compte/demandes` },
        }),
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
        from: process.env.MAIL_FROM || 'Moncode <no-reply@moncode.bj>',
        to: [email],
        subject: `Votre QR code : ${input.title}`,
        html: emailLayout({
          title: 'Votre QR code est prêt',
          preheader: `QR code « ${input.title} » en pièce jointe.`,
          intro: `Voici votre QR code <strong>${esc(input.title)}</strong>, en pièce jointe (PNG).`,
          bodyHtml: `<p style="margin:16px 0 0;font-size:14px;color:#4a4a52">Contenu : <span style="word-break:break-all">${esc(input.target)}</span></p>`,
          button: { label: 'Ouvrir mon espace', href: `${primaryAppUrl()}/compte` },
          note: 'Retrouvez tous vos QR codes dans votre espace Moncode.',
        }),
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
 * Transmet à l'équipe un message du formulaire de contact (destinataire : CONTACT_TO, par défaut contact@moncode.bj).
 * L'adresse du visiteur est mise en « répondre à » : il suffit de répondre pour lui écrire.
 */
export async function sendContactMessage(m: ContactMessage): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'Le service d’envoi n’est pas configuré (RESEND_API_KEY).' };
  const to = process.env.CONTACT_TO || 'contact@moncode.bj';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Moncode <no-reply@moncode.bj>',
        to: [to],
        reply_to: m.email,
        subject: `Contact Moncode : ${m.name}${m.business ? ` (${m.business})` : ''}`,
        html: emailLayout({
          title: 'Nouveau message de contact',
          preheader: `${m.name} vous a écrit.`,
          intro: `<strong>${esc(m.name)}</strong>${m.business ? ` · ${esc(m.business)}` : ''}${m.kind ? ` · ${esc(m.kind)}` : ''}<br>${esc(m.email)} · ${esc(m.phone)}`,
          bodyHtml: `<p style="margin:16px 0 0;padding:12px 14px;background:#faf6f6;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(m.message)}</p>`,
          note: 'Répondez directement à cet e-mail : la réponse part chez la personne.',
        }),
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
        from: process.env.MAIL_FROM || 'Moncode <no-reply@moncode.bj>',
        to: [email],
        subject: 'Réinitialisez votre mot de passe Moncode',
        html: emailLayout({
          title: 'Réinitialisez votre mot de passe',
          preheader: 'Ce lien est valable une heure.',
          intro: `Bonjour${name ? ` ${esc(name)}` : ''}, vous avez demandé à choisir un nouveau mot de passe pour votre compte Moncode. Ce lien est valable <strong>une heure</strong>.`,
          button: { label: 'Choisir un nouveau mot de passe', href: link },
          bodyHtml: `<p style="margin:20px 0 6px;font-size:13px;color:#7a7a84">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :</p><p style="margin:0;padding:10px 12px;background:#faf6f6;border:1px solid #ece4e4;border-radius:8px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#17171a;word-break:break-all">${esc(link)}</p>`,
          note: 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.',
        }),
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
