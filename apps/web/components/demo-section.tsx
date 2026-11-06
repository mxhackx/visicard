"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/section-heading";

/** Démo en vidéo : se lance (sans le son) quand la section apparaît, s'arrête quand on la quitte. */
export default function DemoSection() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="demo" className="anchor">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading title="Voyez-le en action" subtitle="Un lien, un style, un QR code prêt à télécharger : 30 secondes." />

        <div className="surface mt-10 overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(23,23,26,0.12)]" data-reveal>
          <div className="flex items-center gap-1.5 border-b border-line bg-cream-deep px-4 py-2.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-xs text-sage">moncode.app/qr-gratuit</span>
          </div>
          <video
            ref={video}
            className="block aspect-video w-full bg-cream"
            src="/demo.mp4"
            poster="/demo-poster.jpg"
            muted
            loop
            playsInline
            controls
            preload="none"
            aria-label="Démonstration : créer un QR code Moncode"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/qr-gratuit" className="btn btn-primary">
            Essayer maintenant <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
