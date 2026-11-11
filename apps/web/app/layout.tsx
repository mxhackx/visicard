import type { Metadata, Viewport } from "next";
import { SITE, SITE_URL, organizationJsonLd } from "@/lib/site";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { FileProvider } from "./context/FileContext";
import WhatsAppButton from "@/components/whatsapp-button";
import ScrollProgress from "@/components/scroll-progress";
import RevealObserver from "@/components/reveal-observer";
import GoogleOneTap from "@/components/account/google-one-tap";
import { DialogsProvider } from "@/components/account/auth-dialog";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "technology",
  alternates: { canonical: "/", languages: { fr: "/", "x-default": "/" } },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE_URL,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Moncode — pages digitales et QR codes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f4f6",
};

/** JSON-LD sûr dans une balise script (aucun « </script> » possible). */
const jsonLd = JSON.stringify(organizationJsonLd()).replace(/</g, "\\u003c");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn("h-full antialiased font-sans", inter.variable)} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        {/* Déjà vue pendant cette session (ajouter ?intro à l'adresse pour la revoir) : l'animation d'accueil est masquée avant le premier affichage (pas de clignotement). */}
        <Script id="intro-seen" strategy="beforeInteractive">
          {"try{if(sessionStorage.getItem('moncode-intro')&&!/[?&]intro\\b/.test(location.search))document.documentElement.classList.add('intro-seen')}catch(e){}"}
        </Script>
      </head>
      <body className="flex min-h-full flex-col text-ink">
        <FileProvider>
          <DialogsProvider>
            <ScrollProgress />
            <RevealObserver />
            <GoogleOneTap />
            {children}
            <WhatsAppButton />
          </DialogsProvider>
        </FileProvider>
      </body>
    </html>
  );
}
