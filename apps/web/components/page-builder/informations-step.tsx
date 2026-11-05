"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Clock,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  MessageCircle,
  Share2,
  Store,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import AdminShell from "@/components/admin/AdminShell";
import Header from "@/components/header";
import Stepper from "@/components/order/stepper";
import { BUILDER_FLOWS, type BuilderMode } from "@/lib/builder-flows";
import { IMAGE_ACCEPT, LIMITS, imageError, isHttpUrl, normalizeUrl, phoneDigits, pickImages } from "@/lib/validation";

const COUNTRY_CODES = [
  { code: "+229", label: "Bénin +229" },
  { code: "+225", label: "Côte d’Ivoire +225" },
  { code: "+228", label: "Togo +228" },
  { code: "+221", label: "Sénégal +221" },
  { code: "+226", label: "Burkina Faso +226" },
  { code: "+237", label: "Cameroun +237" },
  { code: "+241", label: "Gabon +241" },
  { code: "+243", label: "RD Congo +243" },
  { code: "+33", label: "France +33" },
  { code: "+32", label: "Belgique +32" },
  { code: "+41", label: "Suisse +41" },
  { code: "+44", label: "Royaume-Uni +44" },
  { code: "+1", label: "États-Unis / Canada +1" },
];

const DAYS = [
  { id: "monday", label: "Lundi" },
  { id: "tuesday", label: "Mardi" },
  { id: "wednesday", label: "Mercredi" },
  { id: "thursday", label: "Jeudi" },
  { id: "friday", label: "Vendredi" },
  { id: "saturday", label: "Samedi" },
  { id: "sunday", label: "Dimanche" },
] as const;

const SOCIALS = [
  { field: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/…" },
  { field: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/…" },
  { field: "xUrl", label: "X (Twitter)", placeholder: "https://x.com/…" },
  { field: "snapchatUrl", label: "Snapchat", placeholder: "https://snapchat.com/add/…" },
] as const;


const ADMIN_STEPS = ["Informations", "Apparence", "QR code"] as const;
const CLIENT_STEPS = ["Informations", "Apparence", "Devis", "Paiement"] as const;

type TextField =
  | "restaurantName"
  | "locationUrl"
  | "phoneNumber"
  | "address"
  | "facebookUrl"
  | "instagramUrl"
  | "xUrl"
  | "snapchatUrl"
  | "additionalInfo";

type ErrorKey = "name" | "phone" | "location" | "photos" | "address" | "info" | (typeof SOCIALS)[number]["field"];
type Errors = Partial<Record<ErrorKey, string>>;

export default function InformationsStep({ mode }: { mode: BuilderMode }) {
  if (mode === "admin") {
    return (
      <AdminShell active="new" title="Nouvelle page digitale" hint="Étape 1 sur 3 · Informations">
        {() => <InformationsBody mode="admin" />}
      </AdminShell>
    );
  }
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <InformationsBody mode="client" />
      </div>
    </main>
  );
}

function InformationsBody({ mode }: { mode: BuilderMode }) {
  const router = useRouter();
  const flow = BUILDER_FLOWS[mode];
  const {
    restaurantInfo,
    setRestaurantInfo,
    setRestaurantLogo,
    addMenuFiles,
    removeMenuFile,
    addPlaceFiles,
    removePlaceFile,
  } = useFile();

  const [errors, setErrors] = useState<Errors>({});
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  /** Photos écartées à la sélection (format, poids, nombre). */
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);
  const placeInputRef = useRef<HTMLInputElement>(null);

  // Le numéro est stocké en entier (+229…) ; on le découpe une fois pour l'affichage.
  const [countryCode, setCountryCode] = useState(() => {
    const phone = restaurantInfo.phoneNumber || "";
    return COUNTRY_CODES.find((c) => phone.startsWith(c.code))?.code ?? "+229";
  });
  const [localNumber, setLocalNumber] = useState(() => {
    const phone = restaurantInfo.phoneNumber || "";
    const match = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
    return match ? phone.slice(match.code.length).trim() : phone;
  });

  const clearError = (key: keyof Errors) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setText = (field: TextField, value: string) => {
    setRestaurantInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updatePhone = (code: string, num: string) => {
    setText("phoneNumber", `${code}${num.replace(/\s+/g, "")}`);
    clearError("phone");
  };

  const locate = () => {
    setLocateError(null);
    if (!navigator.geolocation) {
      setLocateError("La géolocalisation n’est pas disponible sur ce navigateur.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setText("locationUrl", `https://maps.google.com/?q=${latitude},${longitude}`);
        clearError("location");
      },
      () => {
        setIsLocating(false);
        setLocateError("Position introuvable. Autorisez la localisation ou collez un lien Google Maps.");
      },
    );
  };

  const setDay = (day: string, field: "isOpen" | "open" | "close", value: boolean | string) => {
    setRestaurantInfo((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: { ...prev.schedule[day], [field]: value } },
    }));
  };

  const filesUsed =
    restaurantInfo.menuFiles.length + restaurantInfo.placeFiles.length + (restaurantInfo.logoFile ? 1 : 0);

  const pickFiles = (e: ChangeEvent<HTMLInputElement>, group: "menu" | "place") => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const { accepted, message } = pickImages(files, {
      already: group === "menu" ? restaurantInfo.menuFiles.length : restaurantInfo.placeFiles.length,
      max: group === "menu" ? LIMITS.menuPhotos : LIMITS.placePhotos,
      totalUsed: filesUsed,
    });
    setPhotoNotice(message);
    if (accepted.length) {
      (group === "menu" ? addMenuFiles : addPlaceFiles)(accepted);
      if (group === "menu") clearError("photos");
    }
  };

  const hasName = Boolean(restaurantInfo.restaurantName.trim());
  const digits = phoneDigits(restaurantInfo.phoneNumber);
  const hasPhone = Boolean(localNumber.trim()) && digits >= 8 && digits <= 15;
  const hasLocation = isHttpUrl(restaurantInfo.locationUrl);
  const hasPhotos = restaurantInfo.menuFiles.length > 0 || Boolean(restaurantInfo.logoFile);
  const openDays = DAYS.filter((d) => restaurantInfo.schedule[d.id]?.isOpen).length;
  const socialsCount = SOCIALS.filter((s) => restaurantInfo[s.field].trim()).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    const name = restaurantInfo.restaurantName.trim();
    if (!name) found.name = "Indiquez le nom de l’établissement.";
    else if (name.length < 2) found.name = "Le nom doit compter au moins 2 caractères.";
    if (!localNumber.trim()) found.phone = "Indiquez le numéro WhatsApp de l’établissement.";
    else if (!hasPhone) found.phone = "Numéro invalide : vérifiez l’indicatif et le nombre de chiffres.";
    if (!restaurantInfo.locationUrl.trim()) found.location = "Ajoutez la localisation : position actuelle ou lien Google Maps.";
    else if (!hasLocation) found.location = "Lien invalide : collez l’adresse complète (https://maps.app.goo.gl/…).";
    if (restaurantInfo.address.length > LIMITS.address) found.address = `${LIMITS.address} caractères au maximum.`;
    if (restaurantInfo.additionalInfo.length > LIMITS.info) found.info = `${LIMITS.info} caractères au maximum.`;
    for (const social of SOCIALS) {
      const value = restaurantInfo[social.field].trim();
      if (value && !isHttpUrl(value)) found[social.field] = `Lien ${social.label} invalide (https://…).`;
    }
    if (!hasPhotos) found.photos = "Ajoutez au moins le logo ou une photo du menu.";
    setErrors(found);
    if (Object.keys(found).length === 0) {
      router.push(flow.informations.next);
      return;
    }
    // Amène le premier champ en erreur à l'écran.
    const order: ErrorKey[] = ["name", "address", "info", "phone", "location", "photos", ...SOCIALS.map((s) => s.field)];
    const first = order.find((k) => found[k]);
    document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const checklist = [
    { label: "Nom de l’établissement", done: hasName },
    { label: "Numéro WhatsApp", done: hasPhone },
    { label: "Localisation", done: hasLocation },
    { label: "Logo ou photo du menu", done: hasPhotos },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={flow.informations.back}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> {flow.informations.backLabel}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-3xl">
            Informations de l’établissement
          </h1>
          <p className="mt-1 text-sm text-sage">
            Ce que les clients verront en scannant le QR code. Seuls les champs marqués d’un point sont obligatoires.
          </p>
        </div>
        <div className="w-full max-w-xl">
          <Stepper current={0} steps={mode === "admin" ? ADMIN_STEPS : CLIENT_STEPS} />
        </div>
      </div>

      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Identité */}
          <Section icon={Store} title="Identité" subtitle="Le nom et l’adresse affichés en haut de la page.">
            <Field id="name" label="Nom de l’établissement" required error={errors.name}>
              <input
                className="field"
                value={restaurantInfo.restaurantName}
                onChange={(e) => {
                  setText("restaurantName", e.target.value);
                  clearError("name");
                }}
                placeholder="Le Comptoir, Haie Vive"
                maxLength={LIMITS.name}
                autoFocus
                aria-invalid={errors.name ? "true" : undefined}
              />
            </Field>
            <Field id="address" label="Adresse" hint="Quartier, rue, repère : ce qui aide à vous trouver." error={errors.address}>
              <input
                className="field"
                value={restaurantInfo.address}
                maxLength={LIMITS.address}
                onChange={(e) => {
                  setText("address", e.target.value);
                  clearError("address");
                }}
                placeholder="Haie Vive, rue 12.075, face à la pharmacie"
              />
            </Field>
            <Field
              id="info"
              label="Informations supplémentaires"
              hint={`Spécialités, livraison, moyens de paiement… La 1re ligne sert d’accroche. ${restaurantInfo.additionalInfo.length} / ${LIMITS.info}`}
              error={errors.info}
            >
              <textarea
                rows={3}
                className="field leading-6"
                value={restaurantInfo.additionalInfo}
                maxLength={LIMITS.info}
                onChange={(e) => {
                  setText("additionalInfo", e.target.value);
                  clearError("info");
                }}
                placeholder="Livraison à Cotonou de 11 h à 22 h · Paiement MoMo accepté"
              />
            </Field>
          </Section>

          {/* Contact & localisation */}
          <Section icon={MessageCircle} title="Contact et localisation" subtitle="Les boutons « WhatsApp » et « Itinéraire » de la page.">
            <Field id="phone" label="Numéro WhatsApp" required error={errors.phone}>
              <div className="flex gap-2">
                <select
                  className="field w-auto shrink-0 pr-8"
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    updatePhone(e.target.value, localNumber);
                  }}
                  aria-label="Indicatif du pays"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  className="field min-w-0 flex-1"
                  type="tel"
                  inputMode="tel"
                  value={localNumber}
                  onChange={(e) => {
                    setLocalNumber(e.target.value);
                    updatePhone(countryCode, e.target.value);
                  }}
                  placeholder="01 97 00 00 00"
                  aria-invalid={errors.phone ? "true" : undefined}
                />
              </div>
            </Field>

            <Field id="location" label="Localisation" required error={errors.location ?? locateError ?? undefined}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sage" />
                  <input
                    className="field pl-9"
                    type="url"
                    value={restaurantInfo.locationUrl}
                    onBlur={(e) => setText("locationUrl", normalizeUrl(e.target.value))}
                    onChange={(e) => {
                      setText("locationUrl", e.target.value);
                      clearError("location");
                    }}
                    placeholder="Lien Google Maps"
                    aria-invalid={errors.location ? "true" : undefined}
                  />
                </div>
                <button type="button" onClick={locate} disabled={isLocating} className="btn btn-outline shrink-0">
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  {isLocating ? "Localisation…" : "Ma position"}
                </button>
              </div>
              {hasLocation && !errors.location && (
                <a
                  href={restaurantInfo.locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-xs font-medium text-forest hover:underline"
                >
                  Vérifier sur la carte ↗
                </a>
              )}
            </Field>
          </Section>

          {/* Photos */}
          <Section
            id="photos"
            icon={Camera}
            title="Photos"
            subtitle="Le logo ou au moins une photo du menu est nécessaire."
            error={errors.photos}
          >
            <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink/70">Logo</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const problem = imageError(file);
                    setPhotoNotice(problem);
                    if (problem) return;
                    if (!restaurantInfo.logoFile && filesUsed >= LIMITS.totalFiles) {
                      setPhotoNotice(`Limite atteinte : ${LIMITS.totalFiles} fichiers au total.`);
                      return;
                    }
                    setRestaurantLogo(file);
                    clearError("photos");
                  }}
                />
                {restaurantInfo.logoPreview ? (
                  <Thumb src={restaurantInfo.logoPreview} alt="Logo" onRemove={() => setRestaurantLogo(null)} square />
                ) : (
                  <DropButton label="Ajouter le logo" onClick={() => logoInputRef.current?.click()} square />
                )}
              </div>

              <PhotoGroup
                icon={UtensilsCrossed}
                label="Photos du menu"
                hint="Une photo par page de la carte."
                previews={restaurantInfo.menuPreviews}
                onAdd={() => menuInputRef.current?.click()}
                onRemove={removeMenuFile}
              />
              <input
                ref={menuInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => pickFiles(e, "menu")}
              />
            </div>

            <div className="border-t border-line pt-5">
              <PhotoGroup
                icon={ImagePlus}
                label="Photos du lieu"
                hint="Salle, terrasse, plats : facultatif, mais ça donne envie."
                previews={restaurantInfo.placePreviews}
                onAdd={() => placeInputRef.current?.click()}
                onRemove={removePlaceFile}
              />
              <input
                ref={placeInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => pickFiles(e, "place")}
              />
            </div>
            {photoNotice && (
              <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {photoNotice}
              </p>
            )}
            <p className="text-xs text-sage">
              JPG, PNG ou WEBP, {LIMITS.imageMb} Mo maximum par photo · {LIMITS.menuPhotos} photos du menu et {LIMITS.placePhotos} du lieu au plus, {LIMITS.totalFiles} fichiers au total ({filesUsed} utilisés).
            </p>
          </Section>

          {/* Horaires */}
          <Section icon={Clock} title="Horaires" subtitle="Activez les jours d’ouverture.">
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
              {DAYS.map((day) => {
                const hours = restaurantInfo.schedule[day.id] ?? { isOpen: false, open: "09:00", close: "22:00" };
                return (
                  <li key={day.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hours.isOpen}
                      aria-label={`${day.label} ouvert`}
                      onClick={() => setDay(day.id, "isOpen", !hours.isOpen)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        hours.isOpen ? "bg-forest" : "bg-line"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${
                          hours.isOpen ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className={`w-24 text-sm font-medium ${hours.isOpen ? "text-ink/90" : "text-sage"}`}>
                      {day.label}
                    </span>
                    {hours.isOpen ? (
                      <span className="ml-auto flex items-center gap-2 text-sm text-sage">
                        <input
                          type="time"
                          className="field h-9 w-[7.5rem] py-1"
                          value={hours.open}
                          onChange={(e) => setDay(day.id, "open", e.target.value)}
                          aria-label={`${day.label}, ouverture`}
                        />
                        à
                        <input
                          type="time"
                          className="field h-9 w-[7.5rem] py-1"
                          value={hours.close}
                          onChange={(e) => setDay(day.id, "close", e.target.value)}
                          aria-label={`${day.label}, fermeture`}
                        />
                      </span>
                    ) : (
                      <span className="ml-auto text-sm text-sage">Fermé</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Réseaux */}
          <Section icon={Share2} title="Réseaux sociaux" subtitle="Facultatif : un bouton par réseau renseigné.">
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIALS.map((s) => (
                <Field key={s.field} id={s.field} label={s.label} error={errors[s.field]}>
                  <input
                    className="field"
                    type="url"
                    value={restaurantInfo[s.field]}
                    onBlur={(e) => setText(s.field, normalizeUrl(e.target.value))}
                    onChange={(e) => {
                      setText(s.field, e.target.value);
                      clearError(s.field);
                    }}
                    placeholder={s.placeholder}
                  />
                </Field>
              ))}
            </div>
          </Section>
        </div>

        {/* Récapitulatif */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface overflow-hidden">
            <div className="brand-surface px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{flow.informations.step}</p>
              <p className="mt-2 truncate text-xl font-semibold">{restaurantInfo.restaurantName.trim() || "Votre établissement"}</p>
              <p className="mt-1 text-sm text-white/75">
                {doneCount === checklist.length ? "Prêt pour l’apparence" : `${doneCount} sur ${checklist.length} éléments requis`}
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width]"
                  style={{ width: `${(doneCount / checklist.length) * 100}%` }}
                />
              </div>
            </div>

            <ul className="space-y-2.5 px-6 py-5 text-sm">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.done ? "bg-forest text-white" : "ring-1 ring-line"
                    }`}
                  >
                    {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={item.done ? "text-ink/85" : "text-sage"}>{item.label}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line px-6 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-sage">Photos</dt>
                <dd className="font-medium text-ink/85">
                  {restaurantInfo.menuFiles.length + restaurantInfo.placeFiles.length + (restaurantInfo.logoFile ? 1 : 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sage">Jours ouverts</dt>
                <dd className="font-medium text-ink/85">{openDays} / 7</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sage">Réseaux</dt>
                <dd className="font-medium text-ink/85">{socialsCount}</dd>
              </div>
            </dl>

            <div className="border-t border-line px-6 py-5">
              <button type="submit" className="btn btn-primary w-full">
                Suivant : apparence
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs text-sage">
                {mode === "admin"
                  ? "Rien n’est enregistré avant la génération du QR code."
                  : "Rien n’est payé à cette étape : le devis vient après."}
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  subtitle,
  error,
  children,
}: {
  id?: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id ? `field-${id}` : undefined}
      className={`surface p-6 sm:p-7 ${error ? "ring-2 ring-red-300" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="icon-tile h-10 w-10">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink/90">{title}</h2>
          <p className="text-sm text-sage">{subtitle}</p>
          {error && <ErrorText>{error}</ErrorText>}
        </div>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div id={id ? `field-${id}` : undefined}>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/70">
          {label}
          {required && <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-label="obligatoire" />}
        </span>
        {children}
      </label>
      {error ? <ErrorText>{error}</ErrorText> : hint ? <span className="mt-1.5 block text-xs text-sage">{hint}</span> : null}
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">
      {children}
    </span>
  );
}

function PhotoGroup({
  icon: Icon,
  label,
  hint,
  previews,
  onAdd,
  onRemove,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  previews: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
          <Icon className="h-3.5 w-3.5 text-forest" /> {label}
          {previews.length > 0 && <span className="font-normal text-sage">· {previews.length}</span>}
        </p>
        <p className="truncate text-xs text-sage">{hint}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {previews.map((src, index) => (
          <Thumb key={src} src={src} alt={`${label} ${index + 1}`} onRemove={() => onRemove(index)} />
        ))}
        <DropButton label={previews.length ? "Ajouter" : "Ajouter des photos"} onClick={onAdd} />
      </div>
    </div>
  );
}

function Thumb({ src, alt, onRemove, square }: { src: string; alt: string; onRemove: () => void; square?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-line bg-white ${square ? "aspect-square w-full max-w-40" : "aspect-[3/4]"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`h-full w-full ${square ? "object-contain p-3" : "object-cover"}`} />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white transition-colors hover:bg-red-600"
        aria-label={`Retirer : ${alt}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DropButton({ label, onClick, square }: { label: string; onClick: () => void; square?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ambre/60 bg-leaf/40 p-3 text-center text-xs font-semibold text-ambre-deep transition-colors hover:bg-leaf ${
        square ? "aspect-square w-full max-w-40" : "aspect-[3/4]"
      }`}
    >
      <ImagePlus className="h-5 w-5" />
      {label}
    </button>
  );
}
