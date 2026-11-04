"use client";

import AdminShell from "./AdminShell";
import OrderView from "@/components/order/order-view";

/** Une commande telle que la voit le client, avec les actions d'encaissement. */
export default function AdminOrderPage({ reference }: { reference: string }) {
  return (
    <AdminShell active="orders" title={`Commande ${reference}`} hint="Vue client et actions administrateur">
      {(token) => <OrderView reference={reference} adminToken={token} />}
    </AdminShell>
  );
}
