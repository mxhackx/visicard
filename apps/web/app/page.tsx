"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useFile } from "./context/FileContext";
import {
  ArrowRight,
  BarChart3,
  Check,
  ExternalLink,
  Lock,
  Menu,
  Palette,
  QrCode,
  Sparkles,
  Zap,
} from "lucide-react";

type Scene = "welcome" | "splash" | "ready";

function QRVisual() {
  const qrPattern = [
    "111111100101101111111",
    "100000101110101000001",
    "101110100101101011101",
    "101110101101101011101",
    "101110100100001011101",
    "100000101011101000001",
    "111111101010101111111",
    "000000001101100000000",
    "110101111001011101101",
    "011011000000100110010",
    "101101111010111011101",
    "110010010111001001100",
    "001111101101110111010",
    "000000001011001010111",
    "111111101101110100101",
    "100000100011011011001",
    "101110101110101111101",
    "101110100101111001010",
    "101110101101001110100",
    "100000101010111001011",
    "111111101101001110101",
  ];

  return (
    <div className="relative flex h-[390px] w-[390px] items-center justify-center sm:h-[450px] sm:w-[450px]">
      {/* Ambient glow */}
      <motion.div
        className="absolute h-64 w-64 rounded-full bg-cyan-300/30 blur-[90px]"
        animate={{
          scale: [0.85, 1.1, 0.85],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rotating ring */}
      <motion.div
        className="absolute h-[350px] w-[350px] rounded-full border border-white/10 sm:h-[410px] sm:w-[410px]"
        animate={{ rotate: 360 }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Corner frame */}
      <div className="absolute inset-[34px] sm:inset-[22px]">
        <span className="absolute left-0 top-0 h-14 w-14 border-l-2 border-t-2 border-white sm:h-20 sm:w-20" />
        <span className="absolute right-0 top-0 h-14 w-14 border-r-2 border-t-2 border-white sm:h-20 sm:w-20" />
        <span className="absolute bottom-0 left-0 h-14 w-14 border-b-2 border-l-2 border-white sm:h-20 sm:w-20" />
        <span className="absolute bottom-0 right-0 h-14 w-14 border-b-2 border-r-2 border-white sm:h-20 sm:w-20" />
      </div>

      {/* QR */}
      <div className="relative z-10 h-[250px] w-[250px] rounded-[18px] bg-white p-5 shadow-[0_0_80px_rgba(255,255,255,0.18)] sm:h-[300px] sm:w-[300px] sm:p-6">
        <div className="relative grid h-full w-full grid-cols-[repeat(21,1fr)] gap-[2px]">
          {qrPattern.flatMap((row, y) =>
            row.split("").map((cell, x) => {
              const isFinder =
                (x < 7 && y < 7) ||
                (x >= 14 && y < 7) ||
                (x < 7 && y >= 14);

              return (
                <span
                  key={`${x}-${y}`}
                  className={
                    cell === "1"
                      ? isFinder
                        ? "rounded-[1px] bg-black"
                        : "rounded-[1px] bg-[#071018]"
                      : "rounded-[1px] bg-white"
                  }
                />
              );
            })
          )}

          {/* Finder overlays */}
          <div className="pointer-events-none absolute left-0 top-0 h-[33.33%] w-[33.33%] rounded-[4px] border-[5px] border-black bg-white p-[5px]">
            <div className="h-full w-full rounded-[2px] bg-black" />
          </div>

          <div className="pointer-events-none absolute right-0 top-0 h-[33.33%] w-[33.33%] rounded-[4px] border-[5px] border-black bg-white p-[5px]">
            <div className="h-full w-full rounded-[2px] bg-black" />
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 h-[33.33%] w-[33.33%] rounded-[4px] border-[5px] border-black bg-white p-[5px]">
            <div className="h-full w-full rounded-[2px] bg-black" />
          </div>

          {/* Scanning light */}
          <motion.div
            className="pointer-events-none absolute -left-5 -right-5 z-20 h-[3px] bg-cyan-300 shadow-[0_0_8px_#fff,0_0_20px_#22d3ee,0_0_50px_#22d3ee]"
            animate={{
              top: ["4%", "96%", "4%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="pointer-events-none absolute -left-10 -right-10 z-10 h-20 bg-cyan-300/20 blur-2xl"
            animate={{
              top: ["0%", "85%", "0%"],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Floating label */}
      <motion.div
        className="absolute -right-1 top-24 z-30 hidden rounded-2xl border border-white/20 bg-black/80 px-4 py-3 backdrop-blur-xl sm:block"
        animate={{ y: [0, -7, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />
          <span className="text-[11px] font-medium text-white">
            QR actif
          </span>
        </div>
      </motion.div>

      <motion.div
        className="absolute -left-2 bottom-24 z-30 hidden rounded-2xl border border-white/20 bg-white px-4 py-3 shadow-xl sm:block"
        animate={{ y: [0, 7, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white">
            <QrCode size={14} />
          </div>

          <div>
            <p className="text-[10px] font-semibold text-black">
              1 scan
            </p>
            <p className="text-[9px] text-neutral-500">
              pour découvrir
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group rounded-3xl bg-white p-6 text-black shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <span className="text-xs font-semibold text-neutral-300">
          {number}
        </span>
      </div>

      <h3 className="mt-8 text-lg font-semibold tracking-tight">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-neutral-500">
        {description}
      </p>

      <div className="mt-6 h-px w-full bg-neutral-100" />

      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
        En savoir plus
        <ArrowRight size={13} />
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { hasSeenIntro, setHasSeenIntro } = useFile();

  const [scene, setScene] = useState<Scene>(() =>
    hasSeenIntro ? "ready" : "welcome"
  );

  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (hasSeenIntro) return;

    const splashTimer = window.setTimeout(() => {
      setScene("splash");
    }, 1200);

    const readyTimer = window.setTimeout(() => {
      setScene("ready");
      setHasSeenIntro(true);
    }, 2000);

    return () => {
      window.clearTimeout(splashTimer);
      window.clearTimeout(readyTimer);
    };
  }, [hasSeenIntro, setHasSeenIntro]);

  const isWelcome = scene === "welcome";

  if (isWelcome) {
    return (
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0757ff] text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="text-5xl font-bold tracking-[-0.07em] sm:text-7xl"
          >
            <span className="font-normal">Mon</span>Code
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm text-white/60"
          >
            Le digital au bout d&apos;un scan.
          </motion.p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0757ff] font-sans text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[600px] w-[600px] rounded-full bg-cyan-300/10 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-50 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="text-2xl font-bold tracking-[-0.07em]"
        >
          <span className="font-normal">Mon</span>Code
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/75 md:flex">
          <Link
            href="#solutions"
            className="transition hover:text-white"
          >
            Solutions
          </Link>

          <Link
            href="#fonctionnement"
            className="transition hover:text-white"
          >
            Fonctionnement
          </Link>

          <Link
            href="#apropos"
            className="transition hover:text-white"
          >
            À propos
          </Link>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Se connecter
          </Link>

          <Link
            href="/choix-profil"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-900 hover:shadow-xl"
          >
            Commencer
          </Link>
        </div>

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 sm:hidden"
          aria-label="Menu"
        >
          <Menu size={19} />
        </button>
      </header>

      {/* Mobile menu */}
      {mobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-40 mx-4 rounded-2xl border border-white/10 bg-black p-5 sm:hidden"
        >
          <div className="flex flex-col gap-4 text-sm">
            <Link href="#solutions">Solutions</Link>
            <Link href="#fonctionnement">Fonctionnement</Link>
            <Link href="#apropos">À propos</Link>

            <div className="mt-2 border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="block py-2 text-white/70"
              >
                Se connecter
              </Link>

              <Link
                href="/choix-profil"
                className="mt-2 block rounded-xl bg-white px-4 py-3 text-center font-semibold text-black"
              >
                Commencer
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <section className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-28 lg:pt-16">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-20"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-md">
            <Sparkles size={13} />

            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              QR nouvelle génération
            </span>
          </div>

          <h1 className="max-w-[650px] text-[56px] font-bold leading-[0.94] tracking-[-0.065em] sm:text-[72px] lg:text-[82px]">
            Votre activité.
            <br />
            <span className="text-white/90">
              Un simple scan.
            </span>
          </h1>

          <p className="mt-7 max-w-[520px] text-[15px] leading-7 text-white/65 sm:text-base">
            Créez une présence digitale élégante pour votre
            restaurant, votre entreprise ou votre activité.
            Un lien, un QR code, une expérience simple.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/choix-profil"
              className="group flex h-14 items-center justify-center gap-5 rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-[0_15px_40px_rgba(0,0,0,0.15)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            >
              Créer mon menu

              <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white transition group-hover:translate-x-1">
                <ArrowRight size={15} />
              </span>
            </Link>

            <Link
              href="/carte-visite"
              className="flex h-14 items-center justify-center gap-3 rounded-xl border border-white/20 bg-black px-6 text-sm font-semibold text-white transition hover:-translate-y-1 hover:bg-neutral-950"
            >
              <QrCode size={17} />

              Carte de visite
            </Link>
          </div>

          {/* Trust */}
          <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_12px_#86efac]" />
              Accessible 24h/24
            </div>

            <div className="h-3 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <Check size={13} />
              Sans application
            </div>

            <div className="h-3 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <Lock size={12} />
              Sécurisé
            </div>
          </div>
        </motion.div>

        {/* QR */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative flex min-h-[480px] items-center justify-center lg:min-h-[620px]"
        >
          <QRVisual />

          <div className="absolute bottom-2 right-0 hidden text-right sm:block lg:right-4">
            <p className="text-xs font-semibold text-white">
              Scannez.
            </p>

            <p className="text-xs font-semibold text-white/60">
              Connectez.
            </p>

            <p className="text-xs font-semibold text-white/40">
              Explorez.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Solutions */}
      <section
        id="solutions"
        className="relative z-10 bg-[#f7f9ff] px-5 py-24 text-black sm:px-8 lg:px-10 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
              Pourquoi MonCode ?
            </span>

            <h2 className="mt-6 text-4xl font-bold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Plus qu&apos;un QR code.
              <br />
              <span className="text-blue-600">
                Une expérience.
              </span>
            </h2>

            <p className="mt-6 text-sm leading-7 text-neutral-500 sm:text-base">
              Une solution pensée pour connecter simplement
              votre présence physique à votre univers digital.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              number="01"
              icon={<Zap size={19} />}
              title="Rapide & simple"
              description="Créez votre présence digitale en quelques minutes, sans compétence technique."
            />

            <FeatureCard
              number="02"
              icon={<Palette size={19} />}
              title="Personnalisable"
              description="Adaptez les couleurs, les informations et l'expérience à votre identité."
            />

            <FeatureCard
              number="03"
              icon={<BarChart3 size={19} />}
              title="Suivi des scans"
              description="Comprenez comment vos clients découvrent votre contenu digital."
            />

            <FeatureCard
              number="04"
              icon={<Lock size={19} />}
              title="Sécurisé"
              description="Une infrastructure conçue pour protéger vos données et votre présence."
            />
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section
        id="fonctionnement"
        className="relative z-10 bg-[#f7f9ff] px-5 pb-28 text-black sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl border-t border-neutral-200 pt-24">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Comment ça marche
              </span>

              <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                Trois étapes.
                <br />
                <span className="text-neutral-400">
                  Rien de plus.
                </span>
              </h2>
            </div>

            <div className="grid gap-3">
              {[
                {
                  number: "01",
                  title: "Choisissez",
                  text: "Choisissez le type de présence digitale dont vous avez besoin.",
                },
                {
                  number: "02",
                  title: "Personnalisez",
                  text: "Ajoutez vos informations, vos produits, vos couleurs et votre identité.",
                },
                {
                  number: "03",
                  title: "Partagez",
                  text: "Votre page est prête. Partagez le lien ou utilisez votre QR code.",
                },
              ].map((step) => (
                <motion.div
                  key={step.number}
                  whileHover={{ x: 5 }}
                  className="group flex gap-6 rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-lg"
                >
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    {step.number}
                  </span>

                  <div>
                    <h3 className="font-semibold tracking-tight">
                      {step.title}
                    </h3>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-500">
                      {step.text}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="ml-auto mt-1 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SaaS preview */}
      <section
        id="apropos"
        className="relative z-10 bg-[#f7f9ff] px-5 pb-32 text-black sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[32px] bg-[#0757ff] p-7 text-white sm:p-12 lg:p-16">
            <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
                  Votre espace
                </span>

                <h2 className="mt-5 text-4xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                  Gérez votre
                  <br />
                  présence digitale.
                </h2>

                <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                  Mettez à jour votre contenu, suivez votre
                  activité et gardez toutes vos informations
                  accessibles depuis un seul espace.
                </p>

                <Link
                  href="/choix-profil"
                  className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-1"
                >
                  Commencer

                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Fake dashboard */}
              <div className="rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                      Mon activité
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      Tableau de bord
                    </p>
                  </div>

                  <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold text-black">
                    M
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[9px] uppercase tracking-widest text-white/35">
                      Visites
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight">
                      1 284
                    </p>

                    <p className="mt-1 text-[9px] text-green-300">
                      +18.4%
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[9px] uppercase tracking-widest text-white/35">
                      Scans
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight">
                      936
                    </p>

                    <p className="mt-1 text-[9px] text-green-300">
                      +12.7%
                    </p>
                  </div>
                </div>

                <div className="relative mt-3 h-40 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
                  <div className="absolute inset-x-0 top-1/4 border-t border-white/5" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-white/5" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-white/5" />

                  <svg
                    viewBox="0 0 600 160"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full text-cyan-300"
                  >
                    <path
                      d="M0 135 C60 128 75 110 120 118 C165 126 175 85 225 93 C275 101 290 65 335 73 C380 81 395 90 430 55 C465 20 500 66 525 46 C550 28 570 38 600 15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    <path
                      d="M0 135 C60 128 75 110 120 118 C165 126 175 85 225 93 C275 101 290 65 335 73 C380 81 395 90 430 55 C465 20 500 66 525 46 C550 28 570 38 600 15 L600 160 L0 160 Z"
                      fill="currentColor"
                      opacity="0.08"
                    />
                  </svg>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-[9px] text-white/40">
                  <span>Votre menu est actif</span>

                  <span className="flex items-center gap-2 text-green-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
                    En ligne
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 bg-[#0757ff] px-5 py-28 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            MonCode
          </span>

          <h2 className="mx-auto mt-5 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            Prêt à passer
            <br />
            au digital ?
          </h2>

          <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-white/55">
            Créez votre première expérience digitale
            et partagez-la dès aujourd&apos;hui.
          </p>

          <Link
            href="/choix-profil"
            className="mt-9 inline-flex items-center gap-5 rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1 hover:bg-neutral-900"
          >
            Commencer maintenant

            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-black">
              <ArrowRight size={15} />
            </span>
          </Link>

          <p className="mt-5 text-[10px] text-white/35">
            Aucune application à installer.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0757ff] px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link
            href="/"
            className="text-xl font-bold tracking-[-0.07em]"
          >
            <span className="font-normal">Mon</span>Code
          </Link>

          <div className="flex items-center gap-6 text-xs text-white/45">
            <Link
              href="#solutions"
              className="transition hover:text-white"
            >
              Solutions
            </Link>

            <Link
              href="#fonctionnement"
              className="transition hover:text-white"
            >
              Fonctionnement
            </Link>

            <Link
              href="/choix-profil"
              className="transition hover:text-white"
            >
              Commencer
            </Link>
          </div>

          <p className="text-[10px] text-white/35">
            © {new Date().getFullYear()} MonCode
          </p>
        </div>
      </footer>
    </main>
  );
}