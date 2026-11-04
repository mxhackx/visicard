import { CardSummary } from "./AdminCardsList";
import Link from "next/link";
import { MoreHorizontal, ExternalLink, Edit, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";

export function AdminTable({ cards, onEdit, onDelete }: { cards: CardSummary[], onEdit: (card: CardSummary) => void, onDelete: (slug: string) => void }) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="h-12 px-4 font-medium">Menu (Slug)</th>
              <th className="h-12 px-4 font-medium">Restaurant</th>
              <th className="h-12 px-4 font-medium">Client</th>
              <th className="h-12 px-4 font-medium">Revenu</th>
              <th className="h-12 px-4 font-medium">Création</th>
              <th className="h-12 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 align-middle font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    <img src={card.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover border" />
                    <span>/{card.slug}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">{card.restaurantName || "-"}</td>
                <td className="p-4 align-middle text-slate-500">{card.clientName || "-"}</td>
                <td className="p-4 align-middle">
                  {card.amountReceived ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      {card.amountReceived}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="p-4 align-middle text-slate-500">
                  {new Date(card.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4 align-middle text-right relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === card.id ? null : card.id)}
                    className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {openDropdown === card.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute right-8 top-10 z-50 min-w-[180px] bg-white rounded-lg shadow-lg border border-slate-100 py-1 text-left animate-in fade-in slide-in-from-top-2">
                        <Link href={`/c/${card.slug}`} target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <ExternalLink className="w-4 h-4" /> Voir le menu
                        </Link>
                        <button onClick={() => { onEdit(card); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                          <Edit className="w-4 h-4" /> Modifier
                        </button>
                        <Link href="/qr-studio" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <QrCode className="w-4 h-4" /> QR Studio
                        </Link>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => { setDeletingId(card.slug); setOpenDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
     <Trash2 className="w-4 h-4" /> Supprimer
   </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Supprimer la carte ?</h3>
            <p className="text-sm text-slate-500 mb-6">Êtes-vous sûr de vouloir supprimer définitivement ce restaurant et toutes ses photos ? Cette action est irréversible.</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">Annuler</button>
              <button onClick={() => { onDelete(deletingId); setDeletingId(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
