import type { Metadata, Viewport } from "next";
import { SITE, SITE_URL, organizationJsonLd } from "@/lib/site";
import { Inter } from "next/font/google";
import "./globals.css";
import { FileProvider } from "./context/FileContext";
import WhatsAppButton from "@/components/whatsapp-button";
import ScrollProgress from "@/components/scroll-progress";
import RevealObserver from "@/components/reveal-observer";
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
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
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
    <html lang="fr" className={cn("h-full antialiased font-sans", inter.variable)}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
