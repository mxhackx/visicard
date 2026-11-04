import type { Metadata } from "next";
import "./globals.css";
import { FileProvider } from "./context/FileContext";
import WhatsAppButton from "@/components/whatsapp-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL("https://moncode-web.vercel.app"),
  title: "Moncode — Menus digitaux en un scan",
  description: "Créez et partagez votre menu digital avec Moncode. Des cartes QR élégantes, personnalisables et faciles à utiliser pour votre restaurant ou commerce.",
  keywords: [
    "menu digital",
    "qr code",
    "restaurant",
    "carte digitale",
    "menu interactif",
    "code QR",
    "Moncode",
  ],
  authors: [{ name: "Moncode" }],
  openGraph: {
    title: "Moncode — Menus digitaux en un scan",
    description: "Solution moderne pour créer des menus digitaux et codes QR personnalisés pour votre établissement.",
    type: "website",
    locale: "fr_FR",
    url: "https://moncode-web.vercel.app",
    siteName: "Moncode",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Moncode - Menus digitaux",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moncode — Menus digitaux en un scan",
    description: "Créez des menus digitaux et QR codes élégants pour votre établissement.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn("h-full antialiased font-sans")}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Moncode",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: "Plateforme de création de menus digitaux et codes QR pour instaurer une expérience client moderne et fluide.",
          url: "https://moncode-web.vercel.app",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
          },
        }) }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <FileProvider>
          {children}
          <WhatsAppButton />
        </FileProvider>
      </body>
    </html>
  );
}
