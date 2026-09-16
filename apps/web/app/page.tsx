"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFile } from "./context/FileContext";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Lock,
  Menu,
  Palette,
  QrCode,
  Sparkles,
  Zap,
} from "lucide-react";

type Scene = "welcome" | "splash" | "ready";

/* -------------------------------------------------------------------------- */
/* LOGO                                                                        */
/* -------------------------------------------------------------------------- */

function Logo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={compact ? "/logo_v.png" : "/logo.png"}
      alt="Visicard"
      width={compact ? 48 : 190}
      height={compact ? 48 : 60}
      priority
      className={`object-contain ${className}`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* QR VISUAL                                                                   */
/* -------------------------------------------------------------------------- */

function QRVisual() {
  const qr = [
    "111111100101101111111",
    "100000101110101000001",
    "101110100101101011101",
    "101110101101101011101",
    "101110100110101011101",
    "100000101011101000001",
    "111111101010101111111",
    "000000001101100000000",
    "110101111001011101101",
    "011011001111100110010",
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
    <div className="relative flex h-[460px] w-[460px] items-center justify-center sm:h-[540px] sm:w-[540px]">
      {/* Large ambient glow */}
      <motion.div
        className="absolute h-[260px] w-[260px] rounded-full bg-cyan-300/30 blur-[110px]"
        animate={{
          scale: [0.8, 1.15, 0.8],
          opacity: [0.25, 0.55, 0.25],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbit */}
      <motion.div
        className="absolute h-[400px] w-[400px] rounded-full border border-white/15 sm:h-[470px] sm:w-[470px]"
        animate={{ rotate: 360 }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute h-[330px] w-[330px] rounded-full border border-white/[0.07] sm:h-[390px] sm:w-[390px]"
        animate={{ rotate: -360 }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Corner frame */}
      <div className="absolute inset-[30px] sm:inset-[20px]">
        <span className="absolute left-0 top-0 h-20 w-20 border-l-2 border-t-2 border-white/70" />
        <span className="absolute right-0 top-0 h-20 w-20 border-r-2 border-t-2 border-white/70" />
        <span className="absolute bottom-0 left-0 h-20 w-20 border-b-2 border-l-2 border-white/70" />
        <span className="absolute bottom-0 right-0 h-20 w-20 border-b-2 border-r-2 border-white/70" />
      </div>

      {/* QR */}
      <div className="relative z-20 h-[290px] w-[290px] rounded-[28px] bg-white p-7 shadow-[0_35px_100px_rgba(0,0,0,0.3)] sm:h-[340px] sm:w-[340px] sm:p-8">
        <div className="relative grid h-full w-full grid-cols-[repeat(21,1fr)] gap-[2px] overflow-hidden">
          {qr.flatMap((row, y) =>
            row.split("").map((cell, x) => (
              <span
                key={`${x}-${y}`}
                className={
                  cell === "1"
                    ? "rounded-[1px] bg-[#05080c]"
                    : "rounded-[1px] bg-white"
                }
              />
            ))
          )}

          {/* Scan beam */}
          <motion.div
            className="pointer-events-none absolute -left-10 -right-10 z-30 h-[4px] bg-white shadow-[0_0_8px_#fff,0_0_25px_#67e8f9,0_0_60px_#22d3ee]"
            animate={{
              top: ["0%", "100%", "0%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="pointer-events-none absolute -left-10 -right-10 z-20 h-24 bg-cyan-300/25 blur-2xl"
            animate={{
              top: ["-10%", "85%", "-10%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Status card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-0 top-[70px] z-30 rounded-2xl border border-white/20 bg-[#05080c]/90 px-5 py-4 shadow-2xl backdrop-blur-xl sm:right-[-10px]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_15px_#6ee7b7]" />

          <div>
            <p className="text-sm font-semibold text-white">
              QR actif
            </p>

            <p className="mt-1 text-sm text-white/55">
              Votre page est en ligne
            </p>
          </div>
        </div>
      </motion.div>

      {/* Scan card */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[65px] left-0 z-30 rounded-2xl bg-white px-5 py-4 shadow-2xl sm:left-[-10px]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0757ff] text-white">
            <QrCode size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold text-black">
              936 scans
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              ce mois-ci
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FEATURE CARD                                                                */
/* -------------------------------------------------------------------------- */

function FeatureCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.25 }}
      className="group rounded-[28px] border border-[#e6eaf2] bg-white p-8 shadow-[0_15px_45px_rgba(15,23,42,0.05)]"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf4ff] text-[#0757ff]">
          {icon}
        </div>

        <span className="text-base font-semibold text-[#b7bfce]">
          {number}
        </span>
      </div>

      <h3 className="mt-9 text-2xl font-bold tracking-[-0.03em] text-[#080b10]">
        {title}
      </h3>

      <p className="mt-4 text-base leading-7 text-[#667085]">
        {description}
      </p>

      <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#0757ff] opacity-0 transition group-hover:opacity-100">
        Découvrir
        <ArrowRight size={16} />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

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
    }, 1100);

    const readyTimer = window.setTimeout(() => {
      setScene("ready");
      setHasSeenIntro(true);
    }, 1900);

    return () => {
      window.clearTimeout(splashTimer);
      window.clearTimeout(readyTimer);
    };
  }, [hasSeenIntro, setHasSeenIntro]);

  /* ---------------------------------------------------------------------- */
  /* INTRO                                                                   */
  /* ---------------------------------------------------------------------- */

  if (scene === "welcome") {
    return (
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0757ff]">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Logo className="w-[210px] sm:w-[280px]" />
          </motion.div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0757ff] font-sans text-white">
      {/* ------------------------------------------------------------------ */}
      {/* BACKGROUND                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-[250px] top-[100px] h-[650px] w-[650px] rounded-full bg-cyan-300/20 blur-[150px]"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute -right-[250px] top-[350px] h-[700px] w-[700px] rounded-full bg-blue-300/20 blur-[160px]"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 75%)",
          }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                              */}
      {/* ------------------------------------------------------------------ */}

      <header className="relative z-50 mx-auto flex h-[92px] max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-14">
        <Link href="/" aria-label="Visicard">
          <Logo className="w-[150px] sm:w-[175px]" />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          <Link
            href="#solutions"
            className="text-base font-medium text-white/75 transition hover:text-white"
          >
            Solutions
          </Link>

          <Link
            href="#fonctionnement"
            className="text-base font-medium text-white/75 transition hover:text-white"
          >
            Fonctionnement
          </Link>

          <Link
            href="#espace"
            className="text-base font-medium text-white/75 transition hover:text-white"
          >
            Votre espace
          </Link>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="rounded-xl px-5 py-3 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Se connecter
          </Link>

          <Link
            href="/choix-profil"
            className="rounded-xl bg-black px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#111]"
          >
            Commencer
          </Link>
        </div>

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/10 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile menu */}
      {mobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-50 mx-5 rounded-2xl border border-white/10 bg-[#05080c] p-6 lg:hidden"
        >
          <div className="flex flex-col gap-5">
            <Link
              href="#solutions"
              className="text-base font-medium text-white"
            >
              Solutions
            </Link>

            <Link
              href="#fonctionnement"
              className="text-base font-medium text-white"
            >
              Fonctionnement
            </Link>

            <Link
              href="#espace"
              className="text-base font-medium text-white"
            >
              Votre espace
            </Link>

            <div className="mt-2 border-t border-white/10 pt-5">
              <Link
                href="/login"
                className="block py-3 text-base font-medium text-white/70"
              >
                Se connecter
              </Link>

              <Link
                href="/choix-profil"
                className="mt-2 block rounded-xl bg-white px-5 py-4 text-center text-base font-semibold text-black"
              >
                Commencer
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative z-10 mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-6 px-6 pb-20 pt-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14 lg:pb-24 lg:pt-4">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-20"
        >
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-md">
            <Sparkles size={17} />

            <span className="text-sm font-semibold text-white">
              La nouvelle génération de cartes digitales
            </span>
          </div>

          <h1 className="max-w-[760px] text-[58px] font-bold leading-[0.94] tracking-[-0.07em] sm:text-[76px] lg:text-[92px]">
            Votre identité.
            <br />

            <span className="text-white/80">
              En un scan.
            </span>
          </h1>

          <p className="mt-9 max-w-[610px] text-lg leading-8 text-white/70 sm:text-xl">
            Créez une expérience digitale élégante pour présenter
            votre activité, vos produits et vos informations.
            Un seul lien. Un seul QR code. Tout votre univers.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/choix-profil"
              className="group flex h-16 items-center justify-center gap-6 rounded-2xl bg-white px-7 text-base font-bold text-[#05080c] shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
            >
              Charger ma carte de visite

              <span className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white transition group-hover:translate-x-1">
                <ArrowRight size={18} />
              </span>
            </Link>

            <Link
              href="/carte-visite"
              className="flex h-16 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-black px-7 text-base font-bold text-white transition hover:-translate-y-1 hover:bg-[#111]"
            >
              <QrCode size={20} />
              Carte de visite
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex items-center gap-3 text-base font-medium text-white/60">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_15px_#6ee7b7]" />
              Toujours accessible
            </div>

            <div className="flex items-center gap-3 text-base font-medium text-white/60">
              <Check size={18} />
              Aucun téléchargement
            </div>

            <div className="flex items-center gap-3 text-base font-medium text-white/60">
              <Lock size={17} />
              Données protégées
            </div>
          </div>
        </motion.div>

        {/* QR */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.85,
            x: 40,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
          }}
          transition={{
            duration: 1,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative flex min-h-[550px] items-center justify-center lg:min-h-[700px]"
        >
          <QRVisual />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WHITE SECTION                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="solutions"
        className="relative z-20 bg-[#f8faff] px-6 py-28 text-[#05080c] sm:px-10 lg:px-14 lg:py-36"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-[800px]">
            <p className="text-base font-bold uppercase tracking-[0.14em] text-[#0757ff]">
              Une plateforme simple
            </p>

            <h2 className="mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Tout ce dont votre
              <br />
              présence digitale a besoin.
            </h2>

            <p className="mt-7 max-w-[650px] text-lg leading-8 text-[#667085] sm:text-xl">
              Une interface pensée pour être belle, claire et
              immédiatement compréhensible.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              number="01"
              icon={<Zap size={24} />}
              title="Instantané"
              description="Créez votre présence digitale rapidement et partagez-la immédiatement."
            />

            <FeatureCard
              number="02"
              icon={<Palette size={24} />}
              title="À votre image"
              description="Construisez une expérience qui reprend votre identité et votre univers."
            />

            <FeatureCard
              number="03"
              icon={<BarChart3 size={24} />}
              title="Mesurable"
              description="Visualisez les visites et les scans pour comprendre votre audience."
            />

            <FeatureCard
              number="04"
              icon={<Lock size={24} />}
              title="Sécurisé"
              description="Vos informations restent protégées grâce à une infrastructure moderne."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STEPS                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="fonctionnement"
        className="relative z-20 bg-[#f8faff] px-6 pb-36 text-[#05080c] sm:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-[1440px] border-t border-[#dfe5ef] pt-28">
          <div className="grid gap-16 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-base font-bold uppercase tracking-[0.14em] text-[#0757ff]">
                Fonctionnement
              </p>

              <h2 className="mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-6xl">
                Trois étapes.
                <br />

                <span className="text-[#98a2b3]">
                  Une expérience.
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  number: "01",
                  title: "Choisissez votre format",
                  description:
                    "Restaurant, carte de visite ou autre présence digitale : choisissez ce que vous souhaitez présenter.",
                },
                {
                  number: "02",
                  title: "Construisez votre page",
                  description:
                    "Ajoutez vos informations, vos contenus et votre identité visuelle depuis une interface simple.",
                },
                {
                  number: "03",
                  title: "Partagez votre QR",
                  description:
                    "Votre page est accessible instantanément. Imprimez votre QR code ou partagez simplement votre lien.",
                },
              ].map((step) => (
                <motion.div
                  key={step.number}
                  whileHover={{ x: 8 }}
                  className="group flex gap-7 rounded-[24px] border border-[#e1e6ef] bg-white p-7 shadow-[0_10px_35px_rgba(15,23,42,0.035)] transition hover:border-[#b8d0ff] hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-sm font-bold text-[#0757ff]">
                    {step.number}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold tracking-[-0.025em]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-base leading-7 text-[#667085]">
                      {step.description}
                    </p>
                  </div>

                  <ChevronRight
                    size={21}
                    className="ml-auto mt-1 shrink-0 text-[#c5ccd8] transition group-hover:translate-x-1 group-hover:text-[#0757ff]"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative z-20 bg-[#0757ff] px-6 py-36 text-center sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Logo className="mx-auto w-[200px] sm:w-[240px]" />

          <h2 className="mx-auto mt-12 max-w-[900px] text-5xl font-bold leading-[0.92] tracking-[-0.07em] sm:text-7xl lg:text-8xl">
            Votre activité mérite
            <br />
            une belle présence.
          </h2>

          <p className="mx-auto mt-8 max-w-[620px] text-lg leading-8 text-white/65 sm:text-xl">
            Créez votre carte digitale, personnalisez votre expérience
            et partagez-la en quelques instants.
          </p>

          <Link
            href="/choix-profil"
            className="mt-10 inline-flex h-16 items-center gap-6 rounded-2xl bg-black px-7 text-base font-bold text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:bg-[#111]"
          >
            Créer mon espace

            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black">
              <ArrowRight size={18} />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                              */}
      {/* ------------------------------------------------------------------ */}

      <footer className="relative z-20 border-t border-white/10 bg-[#0757ff] px-6 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <Link href="/">
            <Logo className="w-[150px]" />
          </Link>

          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Link
              href="#solutions"
              className="text-sm font-medium text-white/55 transition hover:text-white"
            >
              Solutions
            </Link>

            <Link
              href="#fonctionnement"
              className="text-sm font-medium text-white/55 transition hover:text-white"
            >
              Fonctionnement
            </Link>

            <Link
              href="/login"
              className="text-sm font-medium text-white/55 transition hover:text-white"
            >
              Connexion
            </Link>
          </div>

          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Visicard
          </p>
        </div>
      </footer>
    </main>
  );
}
