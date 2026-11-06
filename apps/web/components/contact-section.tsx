"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Navigation, Send } from "lucide-react";
import { CONTACT, directionsUrl, mapEmbedUrl, whatsappUrl } from "@/lib/contact";
import SectionHeading from "@/components/section-heading";

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

export default function ContactSection({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" } = {}) {
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

  return (
    <section id="contact" className="anchor relative overflow-hidden">

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          as={headingLevel}
          title="Parlons de votre établissement"
          subtitle="Une question, un groupe à équiper, un devis ? Décrivez votre situation, nous revenons vers vous avec une proposition concrète."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Formulaire */}
          <div className="glass p-6 sm:p-8" data-reveal>
            {ready ? (
              <ReadyPanel
                summary={summary}
                draft={draft}
                onEdit={() => setReady(false)}
                onReset={() => {
                  setReady(false);
                  setDraft(emptyDraft);
                }}
              />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                    placeholder="+229 01 00 00 00 00"
                  />
                </div>

                <div>
                  <Label htmlFor="kind">Activité</Label>
                  <select
                    id="kind"
                    value={draft.kind}
                    onChange={(event) => update("kind", event.target.value)}
                    className="field mt-2"
                  >
                    {kinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Votre besoin</Label>
                  <textarea
                    id="message"
                    rows={5}
                    value={draft.message}
                    onChange={(event) => update("message", event.target.value)}
                    placeholder="Deux salles à équiper, carte changée chaque semaine, devis pour trois points de vente…"
                    aria-invalid={errors.message ? "true" : undefined}
                    className="field mt-2 resize-y leading-6"
                  />
                  {errors.message && <ErrorText>{errors.message}</ErrorText>}
                </div>

                <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
                  <button type="submit" className="btn btn-primary px-6">
                    <Send className="h-4 w-4" />
                    Préparer ma demande
                  </button>
                  <p className="max-w-xs text-xs leading-5 text-sage">
                    Vos informations restent sur votre appareil jusqu’à ce que vous choisissiez un
                    canal d’envoi.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Coordonnées : canaux + adresse + carte, dans une seule box */}
          <aside
            className="glass flex flex-col overflow-hidden"
            data-reveal
            style={{ "--d": "120ms" } as React.CSSProperties}
            aria-labelledby="coordonnees-title"
          >
            <div className="p-6 sm:p-7">
              <h3 id="coordonnees-title" className="text-lg font-semibold text-ink/90">
                Nos coordonnées
              </h3>
              <p className="mt-1 text-sm text-sage">Choisissez le canal qui vous arrange.</p>

              <ul className="mt-6 space-y-3">
                <Channel
                  icon={MessageCircle}
                  title="WhatsApp"
                  value={CONTACT.whatsappDisplay}
                  hint="Réponse la plus rapide"
                  href={whatsappUrl()}
                  external
                />
                <Channel
                  icon={Mail}
                  title="Email"
                  value={CONTACT.email}
                  href={`mailto:${CONTACT.email}`}
                />
                <Channel icon={Clock} title="Horaires" value={CONTACT.hours} />
                <Channel
                  icon={MapPin}
                  title="Adresse"
                  value={CONTACT.address}
                  hint={`${CONTACT.latitude.toFixed(4)}° N, ${Math.abs(CONTACT.longitude).toFixed(4)}° ${
                    CONTACT.longitude < 0 ? "O" : "E"
                  }`}
                />
              </ul>
            </div>

            <div className="relative mx-3 mb-3 mt-auto overflow-hidden rounded-2xl border border-line shadow-[0_8px_24px_rgba(23,23,26,0.1)]">
              <iframe
                title={`Carte : ${CONTACT.address}`}
                src={mapEmbedUrl()}
                className="block h-56 w-full sm:h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={directionsUrl()}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream/90 px-3 py-1.5 text-xs font-semibold text-forest shadow-sm transition-colors hover:bg-cream-deep"
              >
                <Navigation className="h-3.5 w-3.5" />
                Itinéraire
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ReadyPanel({
  summary,
  draft,
  onEdit,
  onReset,
}: {
  summary: string;
  draft: Draft;
  onEdit: () => void;
  onReset: () => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-ink/90">Votre demande est prête</h3>
      <p className="mt-2 text-sm leading-7 text-sage">
        Elle est pré-remplie ci-dessous. Choisissez le canal d’envoi — nous répondons sous 24 heures
        ouvrées.
      </p>

      <pre className="field mt-5 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-ink/75">
        {summary}
      </pre>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
            `Demande Moncode — ${draft.business.trim() || draft.name}`,
          )}&body=${encodeURIComponent(summary)}`}
          className="btn btn-outline"
        >
          <Mail className="h-4 w-4" />
          Envoyer par email
        </a>
        <a href={whatsappUrl(summary)} target="_blank" rel="noreferrer" className="btn btn-primary">
          <MessageCircle className="h-4 w-4" />
          Envoyer sur WhatsApp
        </a>
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-3 text-sm font-semibold text-sage transition-colors hover:text-ink"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-3 text-sm font-semibold text-sage transition-colors hover:text-ink"
        >
          Recommencer
        </button>
      </div>
    </div>
  );
}

function Channel({
  icon: Icon,
  title,
  value,
  hint,
  href,
  external,
}: {
  icon: typeof Mail;
  title: string;
  value: string;
  hint?: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="icon-tile h-10 w-10">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold uppercase tracking-[0.14em] text-sage">
          {title}
        </span>
        <span className="block truncate text-sm font-medium text-ink/90">{value}</span>
        {hint && <span className="block text-xs text-sage">{hint}</span>}
      </span>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border border-line bg-cream px-3 py-2.5 transition-colors";

  return (
    <li>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className={`${className} hover:border-ambre/50 hover:bg-leaf/40`}
        >
          {body}
        </a>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-ink/70">
      {children}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>;
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
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-sage">(optionnel)</span>}
      </Label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : undefined}
        className="field mt-2"
      />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
