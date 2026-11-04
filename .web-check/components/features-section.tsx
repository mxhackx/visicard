"use client";

import { BarChart3, Globe, Palette, ShieldCheck, Smartphone, Zap } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Personnalisation complète",
    description: "Adaptez votre menu à votre identité visuelle et à votre style de restauration.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Une expérience fluide sur smartphone, tablette et écran desktop.",
  },
  {
    icon: Zap,
    title: "Rapidité",
    description: "Un chargement rapide et une navigation simple pour fidéliser vos clients.",
  },
  {
    icon: BarChart3,
    title: "Suivi des performances",
    description: "Comprenez les scans, les tendances et les interactions de vos clients.",
  },
  {
    icon: Globe,
    title: "Accessible partout",
    description: "Vos menus restent disponibles en ligne à tout moment, pour tout le monde.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance & sécurité",
    description: "Des données et un accès gérés avec sérieux et fiabilité.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Fonctionnalités</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Tout ce qu’il faut pour moderniser votre service</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
