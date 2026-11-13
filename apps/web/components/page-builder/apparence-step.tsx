"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Palette as PaletteIcon, PanelsTopLeft, Smartphone } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import RestaurantCardLayout from "@/components/RestaurantCardLayout";
import AdminShell from "@/components/admin/AdminShell";
import Header from "@/components/header";
import PaletteEditor from "@/components/page-builder/palette-editor";
import DevicePreview, { DeviceSwitch, type Device } from "@/components/page-builder/device-preview";
import { LAYOUT_OPTIONS } from "@/lib/layouts";
import { BUILDER_FLOWS, type BuilderMode } from "@/lib/builder-flows";
import { paletteFor, isCustomThemeId, LAYOUT_DEFAULTS, samePalette, type LayoutId, type Palette } from "@/lib/palette";



export default function ApparenceStep({ mode }: { mode: BuilderMode }) {
  if (mode === "admin") {
    return (
      <AdminShell active="new" title="Nouvelle page digitale" hint="Étape 2 sur 3 · Apparence">
        {() => <ApparenceBody mode="admin" />}
      </AdminShell>
    );
  }
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <ApparenceBody mode="client" />
      </div>
    </main>
  );
}

function ApparenceBody({ mode }: { mode: BuilderMode }) {
  const router = useRouter();
  const flow = BUILDER_FLOWS[mode];
  const { restaurantInfo, customization, setThemeId, setCardLayout } = useFile();
  const [device, setDevice] = useState<Device>("phone");

  const layout = (LAYOUT_OPTIONS.some((l) => l.id === customization.cardLayout) ? customization.cardLayout : "classic") as LayoutId;
  const layoutMeta = LAYOUT_OPTIONS.find((l) => l.id === layout)!;
  const palette = paletteFor(customization.themeId, layout);
  const paletteLabel = isCustomThemeId(customization.themeId) && !samePalette(palette, LAYOUT_DEFAULTS[layout]) ? "Couleurs personnalisées" : "Couleurs d’origine";

  // Les informations ne vivent qu'en mémoire : après un rechargement, on l'explique.
  if (!restaurantInfo.restaurantName.trim()) {
    return (
      <div className="surface mx-auto mt-6 max-w-lg p-8 text-center">
        <span className="icon-tile mx-auto h-12 w-12">
          <Smartphone className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink/90">Commencez par les informations</h1>
        <p className="mt-2 text-sm text-sage">
          L’apparence s’applique au contenu de l’établissement. Les informations saisies ne sont pas conservées
          après un rechargement de la page : il faut les renseigner à nouveau.
        </p>
        <Link href={flow.apparence.back} className="btn btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Aller aux informations
        </Link>
      </div>
    );
  }

  const chooseLayout = (id: LayoutId) => {
    // Une palette laissée « d'origine » suit la disposition ; une palette personnalisée est conservée.
    setCardLayout(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Apparence de la page</h1>
          <p className="mt-1 text-sm text-sage">Choisissez une disposition, puis ses couleurs. L’aperçu se met à jour en direct.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]">
        {/* Réglages */}
        <div className="min-w-0 space-y-6">
          <section className="surface p-6">
            <SectionTitle icon={PanelsTopLeft} title="Disposition" subtitle="La structure de la page après le scan." />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Disposition">
              {LAYOUT_OPTIONS.map((option) => {
                const on = layout === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => chooseLayout(option.id)}
                    className={`group relative flex flex-col rounded-2xl border p-2 text-left transition-all ${
                      on ? "border-forest bg-leaf/50 ring-2 ring-ambre/30" : "border-line bg-white hover:border-ambre/60"
                    }`}
                  >
                    <LayoutThumb id={option.id} palette={on ? palette : LAYOUT_DEFAULTS[option.id]} />
                    <span className="mt-2 px-0.5 text-sm font-semibold text-ink/90">{option.name}</span>
                    <span className="px-0.5 text-xs leading-4 text-sage">{option.desc}</span>
                    {on && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-white shadow">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="surface p-6">
            <SectionTitle icon={PaletteIcon} title="Couleurs" subtitle="Partez d’une palette, puis ajustez chaque couleur." />
            <PaletteEditor themeId={customization.themeId} layout={layout} logoUrl={restaurantInfo.logoPreview ?? undefined} onChange={setThemeId} />
          </section>
        </div>

        {/* Aperçu */}
        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink/80">
                Aperçu · <span className="font-normal text-sage">{layoutMeta.name} · {paletteLabel}</span>
              </p>
              <DeviceSwitch value={device} onChange={setDevice} />
            </div>
            <div className="mt-5">
              <DevicePreview device={device} scrollable>
                <RestaurantCardLayout
                  restaurantName={restaurantInfo.restaurantName}
                  address={restaurantInfo.address}
                  logoUrl={restaurantInfo.logoPreview ?? undefined}
                  locationUrl={restaurantInfo.locationUrl}
                  phoneNumber={restaurantInfo.phoneNumber}
                  facebookUrl={restaurantInfo.facebookUrl}
                  instagramUrl={restaurantInfo.instagramUrl}
                  xUrl={restaurantInfo.xUrl}
                  snapchatUrl={restaurantInfo.snapchatUrl}
                  additionalInfo={restaurantInfo.additionalInfo}
                  schedule={restaurantInfo.schedule}
                  menuImages={restaurantInfo.menuPreviews}
                  placeImages={restaurantInfo.placePreviews}
                  inPreview
                  layout={layout}
                  themeId={customization.themeId}
                />
              </DevicePreview>
            </div>
            <p className="mt-4 text-center text-xs text-sage">Les liens sont désactivés dans l’aperçu. La page publiée s’adapte à chaque écran.</p>
          </div>
        </aside>
      </div>

      {/* Barre d'actions */}
      <div className="sticky bottom-3 z-30">
        <div className="surface flex items-center justify-between gap-4 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          <Link href={flow.apparence.back} className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4" /> Informations
          </Link>
          <p className="hidden truncate text-sm text-sage md:block">
            {restaurantInfo.restaurantName} · {layoutMeta.name} · {paletteLabel}
          </p>
          <button type="button" onClick={() => router.push(flow.apparence.next)} className="btn btn-primary btn-sm">
            {flow.apparence.nextLabel} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Check; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="icon-tile h-10 w-10">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-ink/90">{title}</h2>
        <p className="text-sm text-sage">{subtitle}</p>
      </div>
    </div>
  );
}

/** Vignette schématique de chaque disposition, dans ses couleurs. */
function LayoutThumb({ id, palette: p }: { id: LayoutId; palette: Palette }) {
  const line = `color-mix(in srgb, ${p.text} 14%, ${p.surface})`;
  const soft = `color-mix(in srgb, ${p.text} 7%, ${p.surface})`;
  return (
    <svg viewBox="0 0 80 100" className="h-auto w-full rounded-xl ring-1 ring-black/5" aria-hidden="true">
      <rect width="80" height="100" fill={p.surface} />
      {id === "classic" && (
        <>
          <rect width="80" height="30" fill={p.brand} />
          <rect x="7" y="8" width="12" height="12" rx="3" fill="#fff" />
          <rect x="23" y="10" width="30" height="4" rx="2" fill="#fff" opacity=".9" />
          <rect x="23" y="17" width="20" height="3" rx="1.5" fill="#fff" opacity=".6" />
          <rect x="7" y="25" width="66" height="12" rx="3" fill="#fff" stroke={line} />
          <rect x="10" y="28" width="18" height="6" rx="2" fill={p.brand} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={7 + (i % 2) * 34} y={44 + Math.floor(i / 2) * 27} width="32" height="24" rx="3" fill={soft} stroke={line} />
          ))}
        </>
      )}
      {id === "saas" && (
        <>
          <rect width="80" height="9" fill={p.surface} />
          <rect x="6" y="3" width="14" height="3" rx="1.5" fill={p.text} />
          <rect x="58" y="2" width="16" height="5" rx="1.5" fill={p.brand} />
          <rect x="0" y="9" width="80" height=".6" fill={line} />
          <rect x="16" y="16" width="48" height="5" rx="2" fill={p.text} />
          <rect x="22" y="24" width="36" height="3" rx="1.5" fill={line} />
          <rect x="22" y="31" width="17" height="5" rx="1.5" fill={p.brand} />
          <rect x="41" y="31" width="17" height="5" rx="1.5" fill="none" stroke={line} />
          <rect x="12" y="42" width="56" height="30" rx="3" fill={soft} stroke={line} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={7 + i * 23} y="78" width="20" height="16" rx="3" fill="#fff" stroke={line} />
          ))}
        </>
      )}
      {id === "maps" && (
        <>
          <rect width="80" height="34" fill={p.brand} opacity=".85" />
          <circle cx="40" cy="34" r="9" fill="#fff" stroke={p.surface} strokeWidth="2" />
          <rect x="24" y="47" width="32" height="4" rx="2" fill={p.text} />
          <rect x="18" y="55" width="30" height="6" rx="3" fill={p.brand} />
          <circle cx="54" cy="58" r="3" fill={line} />
          <circle cx="62" cy="58" r="3" fill={line} />
          <rect x="0" y="67" width="80" height=".6" fill={line} />
          <rect x="24" y="70" width="10" height="1.5" fill={p.brand} />
          <rect x="7" y="76" width="32" height="20" rx="3" fill={soft} />
          <rect x="41" y="76" width="32" height="20" rx="3" fill={soft} />
        </>
      )}
      {id === "minimal" && (
        <>
          <circle cx="40" cy="15" r="5" fill={line} />
          <rect x="18" y="26" width="44" height="6" rx="1" fill={p.text} />
          <rect x="28" y="36" width="24" height="2" rx="1" fill={line} />
          <rect x="36" y="43" width="8" height=".8" fill={p.accent} />
          <rect x="14" y="50" width="52" height="44" fill={soft} />
        </>
      )}
      {id === "premium" && (
        <>
          <rect width="80" height="56" fill={soft} />
          <rect x="7" y="20" width="10" height=".8" fill={p.accent} />
          <rect x="7" y="25" width="60" height="9" fill={p.text} />
          <rect x="7" y="36" width="44" height="9" fill={p.text} />
          <rect x="7" y="48" width="18" height="5" fill={p.brand} />
          <rect x="7" y="64" width="6" height="2" fill={p.accent} />
          <rect x="16" y="63" width="30" height="4" fill={p.text} />
          <rect x="7" y="72" width="32" height="24" fill={line} />
          <rect x="41" y="72" width="32" height="24" fill={line} />
        </>
      )}
      {id === "exoticas" && (
        <>
          <rect width="80" height="52" fill={p.brand} />
          <rect x="10" y="20" width="40" height="6" rx="1" fill="#fff" />
          <rect x="10" y="29" width="30" height="3" rx="1" fill="#fff" opacity=".7" />
          <rect x="10" y="37" width="16" height="5" rx="1.5" fill="#fff" />
          <rect x="52" y="14" width="20" height="30" rx="3" fill="#fff" opacity=".25" />
          <rect x="7" y="58" width="10" height=".8" fill={p.accent} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={7 + i * 23} y="63" width="20" height="24" rx="3" fill="#fff" stroke={line} />
          ))}
          <rect y="92" width="80" height="8" fill={p.brand} />
        </>
      )}
      {id === "maquis" && (
        <>
          <rect width="80" height="16" fill={p.accent} />
          <rect x="22" y="5" width="36" height="6" rx="1" fill={p.brand} />
          <rect x="7" y="22" width="66" height="34" rx="2" fill={p.text} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="12" y={28 + i * 7} width={46 - (i % 2) * 10} height="2" fill="#fff" opacity=".8" />)}
          <rect x="7" y="62" width="32" height="14" rx="2" fill={soft} />
          <rect x="41" y="62" width="32" height="14" rx="2" fill={soft} />
          <rect y="88" width="80" height="12" fill={p.brand} />
        </>
      )}
      {id === "beaute" && (
        <>
          <path d="M10 56 V34 A30 30 0 0 1 70 34 V56 Z" fill={p.accent} opacity=".35" />
          <path d="M16 56 V35 A24 24 0 0 1 64 35 V56 Z" fill={soft} stroke={p.accent} />
          <rect x="22" y="64" width="36" height="5" rx="1" fill={p.text} />
          <rect x="30" y="73" width="20" height="2" rx="1" fill={line} />
          <rect x="28" y="82" width="24" height="7" rx="3.5" fill={p.brand} />
        </>
      )}
      {id === "boutique" && (
        <>
          <rect x="6" y="8" width="68" height="14" fill={p.text} />
          <rect x="6" y="26" width="34" height="30" fill={line} />
          <rect x="42" y="26" width="32" height="14" fill={soft} />
          <rect x="42" y="42" width="32" height="14" fill={p.accent} />
          {[0, 1, 2].map((i) => <rect key={i} x={6 + i * 23} y="62" width="21" height="28" fill={soft} stroke={line} />)}
        </>
      )}
      {id === "hotel" && (
        <>
          <rect width="80" height="8" fill={p.brand} />
          <rect width="80" height="52" y="8" fill={p.brand} />
          <rect x="44" y="8" width="36" height="52" fill={soft} opacity=".5" />
          <rect x="7" y="30" width="32" height="8" fill="#fff" opacity=".9" />
          <rect x="7" y="41" width="24" height="3" fill={p.accent} />
          <rect x="10" y="54" width="60" height="14" fill="#fff" stroke={line} />
          <rect x="7" y="76" width="32" height="18" fill={soft} />
          <rect x="41" y="76" width="32" height="18" fill={soft} />
        </>
      )}
      {id === "clinique" && (
        <>
          <rect width="80" height="6" fill="#d93636" />
          <rect x="7" y="12" width="3" height="10" rx="1" fill={p.brand} />
          <rect x="3.5" y="15.5" width="10" height="3" rx="1" fill={p.brand} />
          <rect x="18" y="15" width="26" height="4" rx="2" fill={p.text} />
          <rect x="7" y="30" width="38" height="6" rx="2" fill={p.text} />
          <rect x="7" y="42" width="24" height="7" rx="3" fill={p.brand} />
          <rect x="48" y="28" width="26" height="26" rx="4" fill={soft} stroke={line} />
          {[0, 1, 2].map((i) => <rect key={i} x="7" y={62 + i * 10} width="66" height="7" rx="2" fill={soft} stroke={line} />)}
        </>
      )}
      {id === "chantier" && (
        <>
          <rect width="80" height="4" fill={p.brand} />
          <rect y="4" width="80" height="44" fill={p.text} />
          <rect x="7" y="16" width="52" height="10" fill="#fff" />
          <rect x="7" y="34" width="22" height="7" fill={p.brand} />
          <rect y="48" width="80" height="4" fill={p.brand} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="7" y={58 + i * 13} width="66" height="10" fill="#fff" />
              <rect x="7" y={58 + i * 13} width="3" height="10" fill={p.brand} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

/** Hook partagé : disposition et couleurs choisies. */
function useAppearance() {
  const { restaurantInfo, customization, setThemeId, setCardLayout } = useFile();
  const layout = (LAYOUT_OPTIONS.some((l) => l.id === customization.cardLayout) ? customization.cardLayout : "classic") as LayoutId;
  const layoutMeta = LAYOUT_OPTIONS.find((l) => l.id === layout)!;
  const palette = paletteFor(customization.themeId, layout);
  const paletteLabel = isCustomThemeId(customization.themeId) && !samePalette(palette, LAYOUT_DEFAULTS[layout]) ? "Couleurs personnalisées" : "Couleurs d’origine";
  return { restaurantInfo, customization, setThemeId, setCardLayout, layout, layoutMeta, palette, paletteLabel };
}

/** Disposition et couleurs, sous forme de cartes : pour le créateur unifié (étape « Apparence »). */
export function AppearanceSections() {
  const { restaurantInfo, customization, setThemeId, setCardLayout, layout, palette } = useAppearance();
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={PanelsTopLeft} title="Disposition" subtitle="La structure de la page après le scan." />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Disposition">
          {LAYOUT_OPTIONS.map((option) => {
            const on = layout === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setCardLayout(option.id)}
                className={`group relative flex flex-col rounded-2xl border p-2 text-left transition-all ${
                  on ? "border-forest bg-leaf/50 ring-2 ring-ambre/30" : "border-line bg-white hover:border-ambre/60"
                }`}
              >
                <LayoutThumb id={option.id} palette={on ? palette : LAYOUT_DEFAULTS[option.id]} />
                <span className="mt-2 px-0.5 text-sm font-semibold text-ink/90">{option.name}</span>
                <span className="px-0.5 text-xs leading-4 text-sage">{option.desc}</span>
                {on && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-white shadow">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="border-t border-line pt-6">
        <SectionTitle icon={PaletteIcon} title="Couleurs" subtitle="Partez d’une palette, puis ajustez chaque couleur." />
        <PaletteEditor themeId={customization.themeId} layout={layout} logoUrl={restaurantInfo.logoPreview ?? undefined} onChange={setThemeId} />
      </div>
    </div>
  );
}

/** Aperçu en direct de la page sur téléphone, iPad ou Mac (même cadre que les autres contenus). */
export function PagePreview() {
  const { restaurantInfo, customization, layout, layoutMeta, paletteLabel } = useAppearance();
  const [device, setDevice] = useState<Device>("phone");
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/80">
          Aperçu · <span className="font-normal text-sage">{layoutMeta.name} · {paletteLabel}</span>
        </p>
        <DeviceSwitch value={device} onChange={setDevice} devices={["phone", "tablet", "laptop"]} />
      </div>
      <div className="mt-5">
        <DevicePreview device={device} scrollable>
          <RestaurantCardLayout
            restaurantName={restaurantInfo.restaurantName}
            address={restaurantInfo.address}
            logoUrl={restaurantInfo.logoPreview ?? undefined}
            locationUrl={restaurantInfo.locationUrl}
            phoneNumber={restaurantInfo.phoneNumber}
            facebookUrl={restaurantInfo.facebookUrl}
            instagramUrl={restaurantInfo.instagramUrl}
            xUrl={restaurantInfo.xUrl}
            snapchatUrl={restaurantInfo.snapchatUrl}
            additionalInfo={restaurantInfo.additionalInfo}
            schedule={restaurantInfo.schedule}
            menuImages={restaurantInfo.menuPreviews}
            placeImages={restaurantInfo.placePreviews}
            inPreview
            layout={layout}
            themeId={customization.themeId}
          />
        </DevicePreview>
      </div>
      <p className="mt-4 text-center text-xs text-sage">Les liens sont désactivés dans l’aperçu. La page publiée s’adapte à chaque écran.</p>
    </div>
  );
}
