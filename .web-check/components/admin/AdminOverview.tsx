import { Users, CreditCard, Utensils, TrendingUp } from "lucide-react";

export function AdminOverview({ cardsCount, totalRevenue }: { cardsCount: number, totalRevenue: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <div className="rounded-xl border bg-white text-slate-900 shadow-sm p-6">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="tracking-tight text-sm font-medium">Revenus Totaux</h3>
          <CreditCard className="h-4 w-4 text-slate-500" />
        </div>
        <div className="text-2xl font-bold">{totalRevenue} FCFA</div>
        <p className="text-xs text-slate-500 mt-1">+20% par rapport au mois dernier</p>
      </div>

      <div className="rounded-xl border bg-white text-slate-900 shadow-sm p-6">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="tracking-tight text-sm font-medium">Restaurants Actifs</h3>
          <Utensils className="h-4 w-4 text-slate-500" />
        </div>
        <div className="text-2xl font-bold">{cardsCount}</div>
        <p className="text-xs text-slate-500 mt-1">Menus digitaux en ligne</p>
      </div>

      <div className="rounded-xl border bg-white text-slate-900 shadow-sm p-6">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="tracking-tight text-sm font-medium">Interventions</h3>
          <Users className="h-4 w-4 text-slate-500" />
        </div>
        <div className="text-2xl font-bold">{cardsCount}</div>
        <p className="text-xs text-slate-500 mt-1">Clients satisfaits</p>
      </div>

      <div className="rounded-xl border bg-white text-slate-900 shadow-sm p-6 bg-blue-50/50">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="tracking-tight text-sm font-medium text-blue-800">Croissance</h3>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-blue-700">Constante</div>
        <p className="text-xs text-blue-600/80 mt-1">L'activité se porte bien</p>
      </div>
    </div>
  );
}
