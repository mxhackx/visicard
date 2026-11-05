"use client";

export interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
}

export const emptyCustomer: CustomerDraft = { name: "", phone: "", email: "" };

/** Coordonnées du client : elles figurent sur le devis et la facture. Aucun compte n'est créé. */
export default function CustomerFields({
  value,
  onChange,
  errors = {},
}: {
  value: CustomerDraft;
  onChange: (next: CustomerDraft) => void;
  errors?: Partial<Record<keyof CustomerDraft, string>>;
}) {
  const set = (key: keyof CustomerDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Vos coordonnées</legend>
      <label className="block sm:col-span-2">
        <span className="text-xs font-semibold text-ink/70">Nom complet ou raison sociale</span>
        <input
          className="field mt-1.5"
          value={value.name}
          onChange={set("name")}
          autoComplete="name"
          placeholder="Awa Houngbo / Le Comptoir SARL"
          aria-invalid={errors.name ? "true" : undefined}
        />
        {errors.name && <span className="mt-1 block text-xs font-medium text-red-600">{errors.name}</span>}
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink/70">Téléphone (WhatsApp)</span>
        <input
          className="field mt-1.5"
          type="tel"
          value={value.phone}
          onChange={set("phone")}
          autoComplete="tel"
          placeholder="+229 01 97 00 00 00"
          aria-invalid={errors.phone ? "true" : undefined}
        />
        {errors.phone && <span className="mt-1 block text-xs font-medium text-red-600">{errors.phone}</span>}
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink/70">
          E-mail <span className="font-normal text-sage">(optionnel, pour recevoir la facture)</span>
        </span>
        <input
          className="field mt-1.5"
          type="email"
          value={value.email}
          onChange={set("email")}
          autoComplete="email"
          placeholder="vous@exemple.com"
          aria-invalid={errors.email ? "true" : undefined}
        />
        {errors.email && <span className="mt-1 block text-xs font-medium text-red-600">{errors.email}</span>}
      </label>
    </fieldset>
  );
}
