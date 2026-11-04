import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FileProvider } from "./context/FileContext";
import WhatsAppButton from "@/components/whatsapp-button";
import ScrollProgress from "@/components/scroll-progress";
import RevealObserver from "@/components/reveal-observer";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://moncode-web.vercel.app"),
  title: "Moncode — Pages digitales, images, vidéos et PDF en un QR code",
  description:
    "Créez un QR code pour une page digitale, une image ou vidéo, ou un document PDF. Compte client inclus, prêt à imprimer.",
  keywords: [
    "qr code",
    "page digitale",
    "menu digital",
    "image qr code",
    "video qr code",
    "pdf qr code",
    "carte digitale",
    "code QR",
    "Moncode",
  ],
  authors: [{ name: "Moncode" }],
  openGraph: {
    title: "Moncode — Pages digitales, images, vidéos et PDF en un QR code",
    description:
      "Trois services : page digitale à 20 000 FCFA, image/vidéo ou PDF à 5 000 FCFA. Créez, téléchargez et gérez vos QR codes.",
    type: "website",
    locale: "fr_FR",
    url: "https://moncode-web.vercel.app",
    siteName: "Moncode",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Moncode — pages digitales et QR codes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moncode — Pages digitales, images, vidéos et PDF en un QR code",
    description:
      "Page digitale, image, vidéo ou PDF : un QR code unique, prêt à imprimer.",
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
    <html lang="fr" className={cn("h-full antialiased font-sans", inter.variable)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#102a6b" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Moncode",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Plateforme de création de QR codes pour pages digitales, images, vidéos et documents PDF.",
          url: "https://moncode-web.vercel.app",
          offers: [
            {
              "@type": "Offer",
              name: "Page digitale",
              price: "20000",
              priceCurrency: "XOF",
            },
            {
              "@type": "Offer",
              name: "QR image, vidéo ou document PDF",
              price: "5000",
              priceCurrency: "XOF",
            },
          ],
        }) }} />
      </head>
      <body className="flex min-h-full flex-col text-ink">
        <FileProvider>
          <ScrollProgress />
          <RevealObserver />
          {children}
          <WhatsAppButton />
        </FileProvider>
      </body>
    </html>
  );
}
