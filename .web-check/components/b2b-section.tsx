"use client";

import Link from "next/link";
import { Building2, MessageCircle, Sparkles, Users } from "lucide-react";

export default function B2BSection() {
  return (
    <section id="b2b" className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Pour les pros</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Une solution pensée pour les restaurants, agences et groupes</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Moncode aide les établissements et agences à lancer rapidement une présence digitale premium, sans dépendre d’une compétence technique interne.
          </p>

          <div className="mt-8 space-y-5">
            {[
              { icon: Sparkles, title: "Déploiement rapide", text: "Mettez en ligne votre menu en quelques minutes." },
              { icon: Building2, title: "Branding cohérent", text: "Créez une expérience digitale fidèle à votre image." },
              { icon: Users, title: "Support dédié", text: "Bénéficiez d’une vraie assistance pour l’évolution de votre offre." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-2xl shadow-slate-900/15">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Offre B2B</p>
          <h3 className="mt-4 text-4xl font-black">À partir de 29€</h3>
          <p className="mt-2 text-slate-300">par mois pour les pros et agences</p>

          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Cartes illimitées</div>
            <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> QR codes personnalisés</div>
            <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Support prioritaire</div>
            <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Branding et intégration</div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">Demander une démo</Link>
            <a href="https://wa.me/33123456789?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20Moncode." target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}
