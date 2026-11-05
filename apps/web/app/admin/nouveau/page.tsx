import type { Metadata } from "next";
import AdminNewHub from "@/components/admin/AdminNewHub";

export const metadata: Metadata = { title: "Nouveau QR code · Administration", robots: { index: false } };

export default function AdminNouveauHubPage() {
  return <AdminNewHub />;
}
