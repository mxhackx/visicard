import type { Metadata } from "next";

/** Espace privé : jamais indexé, même si un lien circule. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
