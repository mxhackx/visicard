import AdminDashboard, { type AdminTab } from "@/components/admin/AdminDashboard";

const TABS: AdminTab[] = ["overview", "cards", "orders", "accounts", "settings"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const raw = (await searchParams).tab;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const tab = TABS.includes(value as AdminTab) ? (value as AdminTab) : "overview";
  return <AdminDashboard tab={tab} />;
}
