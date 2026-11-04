"use client";

import { useState } from "react";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { CONTACT, whatsappUrl } from "@/lib/contact";

type Draft = {
  name: string;
  business: string;
  email: string;
  phone: string;
  kind: string;
  message: string;
};

const emptyDraft: Draft = {
  name: "",
  business: "",
  email: "",
  phone: "",
  kind: "Restaurant",
  message: "",
};

const kinds = ["Restaurant", "Commerce", "Cabinet / service", "Hôtel", "Groupe ou enseigne"];

export default function ContactSection() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [ready, setReady] = useState(false);

  function update(field: keyof Draft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof Draft, string>> = {};
    if (draft.name.trim().length < 2) nextErrors.name = "Indiquez votre nom.";
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) nextErrors.email = "Email invalide.";
    if (draft.phone.trim().replace(/\D/g, "").length < 8)
      nextErrors.phone = "Numéro trop court pour être joint.";
    if (draft.message.trim().length < 10)
      nextErrors.message = "Décrivez votre besoin en quelques mots.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setReady(true);
  }

  const summary = `Demande Moncode
Nom : ${draft.name}
Établissement : ${draft.business || "—"}
Activité : ${draft.kind}
Email : ${draft.email}
Téléphone : ${draft.phone}

${draft.message}`;

  if (ready) {
    return (
      <section id="contact" className="scroll-mt-16 border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Votre demande est prête
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Elle est pré-remplie ci-dessous. Choisissez le canal sur lequel vous voulez être rappelé
              — nous répondons sous 24 heures ouvrées.
            </p>

            <pre className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
              {summary}
            </pre>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl(summary)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4" />
                Envoyer sur WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
                  `Demande Moncode — ${draft.business.trim() || draft.name}`,
                )}&body=${encodeURIComponent(summary)}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" />
                Envoyer par email
              </a>
              <button
                type="button"
                onClick={() => {
                  setReady(false);
                  setDraft(emptyDraft);
                }}
                className="inline-flex items-center justify-center rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="scroll-mt-16 border-b border-slate-100 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold text-blue-600">Contact</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Parlons de votre établissement
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Une question sur le déploiement, un groupe à équiper, un devis à établir ? Décrivez votre
            situation, nous revenons vers vous avec une proposition concrète.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="name"
                label="Nom"
                value={draft.name}
                error={errors.name}
                onChange={(v) => update("name", v)}
                autoComplete="name"
                placeholder="Awa Kouassi"
              />
              <Field
                id="business"
                label="Établissement"
                value={draft.business}
                onChange={(v) => update("business", v)}
                autoComplete="organization"
                placeholder="Le Comptoir des Halles"
                optional
              />
              <Field
                id="email"
                label="Email"
                type="email"
                value={draft.email}
                error={errors.email}
                onChange={(v) => update("email", v)}
                autoComplete="email"
                placeholder="vous@exemple.com"
              />
              <Field
                id="phone"
                label="Téléphone / WhatsApp"
                type="tel"
                value={draft.phone}
                error={errors.phone}
                onChange={(v) => update("phone", v)}
                autoComplete="tel"
                placeholder="+225 07 00 00 00"
              />
            </div>

            <div>
              <label htmlFor="kind" className="text-sm font-semibold text-slate-900">
                Activité
              </label>
              <select
                id="kind"
                value={draft.kind}
                onChange={(event) => update("kind", event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-semibold text-slate-900">
                Votre besoin
              </label>
              <textarea
                id="message"
                rows={5}
                value={draft.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder="Deux salles à équiper, carte changée chaque semaine, devis pour trois points de vente…"
                aria-invalid={errors.message ? "true" : undefined}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-300"
              />
              {errors.message && <p className="mt-2 text-sm text-red-600">{errors.message}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Préparer ma demande
              </button>
              <p className="text-xs leading-5 text-slate-500">
                Vos informations restent sur votre appareil jusqu'à ce que vous choisissiez un canal
                d'envoi.
              </p>
            </div>
          </form>
        </div>

        <aside className="lg:pt-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">
              Autres canaux
            </h3>

            <ul className="mt-5 space-y-4 text-sm">
              <li>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 text-slate-700 hover:text-blue-700"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>
                    WhatsApp {CONTACT.whatsappDisplay}
                    <span className="block text-xs text-slate-500">Réponse la plus rapide</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-start gap-3 text-slate-700 hover:text-blue-700"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>{CONTACT.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>{CONTACT.whatsappDisplay}</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>{CONTACT.hours}</span>
              </li>
            </ul>

            <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">
              Vous voulez juste voir avant de parler ? Demandez un exemple de carte en ligne, nous
              vous envoyons un lien public.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-900">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : undefined}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-300"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
