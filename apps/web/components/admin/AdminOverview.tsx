import { CreditCard, FileText, Images, PanelsTopLeft } from "lucide-react";

export interface OverviewStats {
  total: number;
  revenue: number;
  pages: number;
  media: number;
  documents: number;
  thisMonth: number;
}

const fcfa = new Intl.NumberFormat("fr-FR");

/** Chiffres calculés à partir des QR codes réellement enregistrés. */
export function AdminOverview({ stats }: { stats: OverviewStats }) {
  const tiles = [
    {
      label: "Revenus encaissés",
      value: `${fcfa.format(stats.revenue)} FCFA`,
      note: `${stats.total} QR code${stats.total > 1 ? "s" : ""} au total`,
      icon: CreditCard,
      highlight: true,
    },
    {
      label: "Pages digitales",
      value: stats.pages,
      note: `${stats.thisMonth} créé${stats.thisMonth > 1 ? "s" : ""} ce mois-ci (tous types)`,
      icon: PanelsTopLeft,
    },
    { label: "Images / vidéos", value: stats.media, note: "QR médias en ligne", icon: Images },
    { label: "Documents PDF", value: stats.documents, note: "QR documents en ligne", icon: FileText },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ label, value, note, icon: Icon, highlight }) => (
        <div
          key={label}
          className={`rounded-2xl p-5 ${
            highlight ? "brand-surface shadow-[0_16px_40px_rgba(29,78,216,0.3)]" : "surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${highlight ? "text-white/80" : "text-sage"}`}>{label}</p>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                highlight ? "bg-white/15 text-white" : "bg-leaf text-forest"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className={`mt-3 text-2xl font-semibold ${highlight ? "text-white" : "text-ink/90"}`}>{value}</p>
          <p className={`mt-1 text-xs ${highlight ? "text-white/70" : "text-sage"}`}>{note}</p>
        </div>
      ))}
    </div>
  );
}
