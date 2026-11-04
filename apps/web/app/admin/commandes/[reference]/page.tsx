import AdminOrderPage from "@/components/admin/AdminOrderPage";

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <AdminOrderPage reference={reference.toUpperCase()} />;
}
