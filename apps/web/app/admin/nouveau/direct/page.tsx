import type { Metadata } from "next";
import AdminDirectQr from "@/components/admin/AdminDirectQr";

export const metadata: Metadata = { title: "QR code direct · Administration", robots: { index: false } };

export default function AdminDirectQrPage() {
  return <AdminDirectQr />;
}
