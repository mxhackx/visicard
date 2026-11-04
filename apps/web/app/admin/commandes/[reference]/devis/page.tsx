import OrderDocument from "@/components/order/order-document";

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <main className="min-h-screen print:bg-white">
      <OrderDocument reference={reference.toUpperCase()} kind="devis" admin />
    </main>
  );
}
