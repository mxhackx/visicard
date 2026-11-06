"use client";

import type { CSSProperties } from "react";
import ExoticasTheme from "@/components/card-themes/exoticas-theme";
import ClassicTheme from "@/components/card-themes/classic-theme";
import CoverTheme from "@/components/card-themes/cover-theme";
import MinimalTheme from "@/components/card-themes/minimal-theme";
import AvantGardeTheme from "@/components/card-themes/avant-garde-theme";
import SaasTheme from "@/components/card-themes/saas-theme";
import MaquisTheme from "@/components/card-themes/maquis-theme";
import BeauteTheme from "@/components/card-themes/beaute-theme";
import BoutiqueTheme from "@/components/card-themes/boutique-theme";
import HotelTheme from "@/components/card-themes/hotel-theme";
import CliniqueTheme from "@/components/card-themes/clinique-theme";
import ChantierTheme from "@/components/card-themes/chantier-theme";
import type { CardThemeProps } from "@/components/card-themes/kit";
import { paletteFor, paletteVars } from "@/lib/palette";

interface RestaurantCardLayoutProps extends CardThemeProps {
  /** classic · maps (Couverture) · minimal · premium (Avant-garde) · saas · exoticas · maquis · beaute · boutique · hotel · clinique · chantier */
  layout?: string;
  /** Palette : `custom#…` (couleurs libres), ancien `theme-N`, ou vide (palette de la disposition). */
  themeId?: string;
}

const THEMES = {
  classic: ClassicTheme,
  maps: CoverTheme,
  minimal: MinimalTheme,
  premium: AvantGardeTheme,
  saas: SaasTheme,
  maquis: MaquisTheme,
  beaute: BeauteTheme,
  boutique: BoutiqueTheme,
  hotel: HotelTheme,
  clinique: CliniqueTheme,
  chantier: ChantierTheme,
} as const;

/** Page digitale : applique la palette, puis délègue à la disposition choisie. */
export default function RestaurantCardLayout({ layout = "classic", themeId, ...props }: RestaurantCardLayoutProps) {
  if (layout === "exoticas") return <ExoticasTheme {...props} themeId={themeId} />;

  const Theme = THEMES[layout as keyof typeof THEMES] ?? ClassicTheme;
  const vars = paletteVars(paletteFor(themeId, layout)) as CSSProperties;
  return (
    <div style={vars} className="min-h-full">
      <Theme {...props} />
    </div>
  );
}
