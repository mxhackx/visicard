import {
  Barlow,
  Barlow_Condensed,
  Cormorant_Garamond,
  IBM_Plex_Sans,
  Italiana,
  Jost,
  Mulish,
  Shrikhand,
  Syne,
  Work_Sans,
} from "next/font/google";

/**
 * Polices des dispositions « métier ». `preload: false` (option littérale exigée par next/font) : rien n'est préchargé,
 * le navigateur ne télécharge que la police réellement utilisée par la page.
 */

export const maquisDisplay = Shrikhand({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
export const maquisText = Work_Sans({ subsets: ["latin"], display: "swap", preload: false });
export const beauteDisplay = Italiana({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
export const beauteText = Mulish({ subsets: ["latin"], display: "swap", preload: false });
export const boutiqueDisplay = Syne({ subsets: ["latin"], display: "swap", preload: false });
export const hotelDisplay = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, weight: ["300", "500"] });
export const hotelText = Jost({ subsets: ["latin"], display: "swap", preload: false });
export const cliniqueText = IBM_Plex_Sans({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600"] });
export const chantierDisplay = Barlow_Condensed({ subsets: ["latin"], display: "swap", preload: false, weight: ["600", "800"] });
export const chantierText = Barlow({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "600", "700"] });
