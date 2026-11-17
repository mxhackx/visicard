"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Eye, FileUp, LayoutGrid, QrCode, RotateCcw, ScanLine } from "lucide-react";
import SectionHeading from "@/components/section-heading";

type Step = { title: string; text: string; icon: typeof QrCode; side: "owner" | "guest" };

/* Le chemin : trois étapes pour vous, puis deux pour votre visiteur (la branche finale). */
const STEPS: Step[] = [
  { title: "Vous choisissez le contenu", text: "Lien, Wi-Fi, carte de visite, PDF, image, vidéo ou page digitale : un seul créateur pour tout.", icon: LayoutGrid, side: "owner" },
  { title: "Vous le personnalisez", text: "Vous remplissez les champs ou déposez le fichier, puis choisissez couleurs, forme et logo. Aucune compétence technique.", icon: FileUp, side: "owner" },
  { title: "Vous recevez le QR code", text: "Prêt en quelques secondes, en PNG et SVG, à imprimer. Le contenu peut évoluer ensuite, sans réimprimer.", icon: QrCode, side: "owner" },
  { title: "Votre visiteur scanne", text: "L’appareil photo du téléphone suffit. Aucune application à installer.", icon: ScanLine, side: "guest" },
  { title: "Il consulte", text: "La page, l’image, la vidéo ou le PDF s’ouvre aussitôt. Vous suivez les scans dans votre espace.", icon: Eye, side: "guest" },
];

export default function HowItWorks() {
  // Nombre d'étapes déjà dévoilées : on avance d'un clic.
  const [shown, setShown] = useState(1);
  const done = shown >= STEPS.length;
  const next = () => setShown((n) => Math.min(STEPS.length, n + 1));

  return (
    <section id="fonctionnement" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading title="Trois étapes, un seul scan" subtitle="Cliquez pour suivre le chemin : de votre contenu jusqu’au scan de vos clients." />

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <ol className="relative" aria-label="Étapes">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const open = i < shown;
              const isNext = i === shown;
              const last = i === STEPS.length - 1;
              const branch = step.side === "guest";
              return (
                <li key={step.title} className={`relative pb-8 pl-16 ${branch ? "ml-8 sm:ml-12" : ""} ${last ? "pb-0" : ""}`}>
                  {/* Le tronc relie les étapes ; il se colore à mesure qu'on avance. */}
                  {!last && <span aria-hidden="true" className={`absolute top-12 w-0.5 transition-colors duration-500 left-6 bottom-0 ${i + 1 < shown ? "bg-forest" : "border-l-2 border-dashed border-line bg-transparent"}`} />}
                  {i === 3 && <span aria-hidden="true" className={`absolute -left-[7px] -top-8 h-[calc(2rem+1.5rem)] w-8 rounded-bl-2xl border-b-2 border-l-2 transition-colors duration-500 sm:-left-[23px] sm:w-12 ${open ? "border-forest" : "border-dashed border-line"}`} />}
                  <span aria-hidden="true" className={`absolute top-0 flex h-12 w-12 items-center justify-center rounded-2xl ring-4 ring-white transition-all duration-500 left-0 ${open ? "bg-forest text-white shadow-[0_10px_24px_rgba(227,5,29,0.25)]" : "bg-cream-deep text-sage"}`}>
                    {open ? <Icon className="h-5 w-5" /> : <span className="text-sm font-semibold">{i + 1}</span>}
                  </span>

                  {i === 3 && open && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-forest">Côté visiteur</p>}

                  {open ? (
                    <div className="animate-[fadeUp_.45s_ease-out]">
                      <h3 className="pt-1.5 text-lg font-semibold text-ink">{step.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-7 text-sage">{step.text}</p>
                    </div>
                  ) : isNext ? (
                    <button type="button" onClick={next} className="group flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-forest/40 bg-white px-4 py-3 text-left transition hover:border-forest hover:bg-cream-deep/60">
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-forest">Étape {i + 1}</span>
                        <span className="block text-[15px] font-medium text-ink">{step.title}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-forest transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <p className="pt-3 text-[15px] text-sage/60">Étape {i + 1}</p>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-24">
            <div className="surface overflow-hidden">
              <div className="relative aspect-[16/10] bg-cream-deep">
                <Image src="/illustrations/scan-qr.svg" alt="Un téléphone scanne un QR code" fill unoptimized sizes="(max-width: 1024px) 100vw, 440px" className="object-contain p-6" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{done ? "Chemin terminé" : `Étape ${shown} sur ${STEPS.length}`}</p>
                  <div className="flex gap-1.5" aria-hidden="true">
                    {STEPS.map((s, i) => <span key={s.title} className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${i < shown ? "bg-forest" : "bg-line"}`} />)}
                  </div>
                </div>
                <div className="mt-5">
                  {done ? (
                    <div className="space-y-3">
                      <p className="flex items-start gap-2 text-[15px] leading-7 text-sage"><Check className="mt-1 h-4 w-4 shrink-0 text-forest" /> Un QR code par contenu : créez-en autant que vous voulez.</p>
                      <div className="flex flex-wrap gap-3">
                        <a href="/creer" className="btn btn-primary btn-sm">Créer mon QR code <ArrowRight className="h-4 w-4" /></a>
                        <button type="button" onClick={() => setShown(1)} className="btn btn-outline btn-sm"><RotateCcw className="h-4 w-4" /> Revoir</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={next} className="btn btn-primary w-full">
                      Étape suivante <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
