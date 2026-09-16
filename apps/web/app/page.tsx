"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  Lock,
  QrCode,
  ScanLine,
  Share2,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Votre QR Code",
    description:
      "Créez un QR Code professionnel qui donne instantanément accès à vos informations.",
  },
  {
    icon: UserRound,
    title: "Votre identité",
    description:
      "Présentez vos coordonnées, votre activité et vos liens professionnels au même endroit.",
  },
  {
    icon: Share2,
    title: "Partage instantané",
    description:
      "Partagez votre profil avec un simple scan, par lien ou directement depuis votre téléphone.",
  },
  {
    icon: Download,
    title: "Prêt à utiliser",
    description:
      "Téléchargez votre QR Code en haute définition pour l'impression et vos supports digitaux.",
  },
];

const steps = [
  {
    number: "01",
    icon: UserRound,
    title: "Créez votre profil",
    description:
      "Renseignez vos informations professionnelles et personnalisez votre présence.",
  },
  {
    number: "02",
    icon: QrCode,
    title: "Générez votre Code",
    description:
      "MonCode transforme automatiquement vos informations en un QR Code professionnel.",
  },
  {
    number: "03",
    icon: ScanLine,
    title: "Partagez",
    description:
      "Votre contact scanne votre Code et accède immédiatement à votre profil.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -6 }}
      className="group rounded-[28px] border border-[#e6eaf2] bg-white p-7 transition-shadow duration-300 hover:shadow-[0_25px_70px_rgba(5,8,12,0.08)]"
    >
      <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-[#edf4ff] text-[#0757ff] transition duration-300 group-hover:scale-105">
        <Icon size={24} strokeWidth={1.8} />
      </div>

      <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#05080c]">
        {title}
      </h3>

      <p className="mt-3 text-[15px] leading-7 text-[#667085]">
        {description}
      </p>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faff] text-[#05080c]">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="absolute left-0 right-0 top-0 z-50">
        <div className="mx-auto flex h-[92px] w-full max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-14">

          <Link
            href="/"
            className="group flex items-center gap-2"
            aria-label="MonCode - accueil"
          >
            <span className="text-[25px] font-bold tracking-[-0.06em] text-white">
              Mon<span className="text-white/60">Code</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            <Link
              href="#solutions"
              className="text-sm font-medium text-white/65 transition hover:text-white"
            >
              Solutions
            </Link>

            <Link
              href="#fonctionnement"
              className="text-sm font-medium text-white/65 transition hover:text-white"
            >
              Fonctionnement
            </Link>

            <Link
              href="#espace"
              className="text-sm font-medium text-white/65 transition hover:text-white"
            >
              Votre espace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:block"
            >
              Se connecter
            </Link>

            <Link
              href="/carte-visite"
              className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#05080c] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Commencer
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section
        id="accueil"
        className="relative z-10 flex min-h-[760px] items-center justify-center overflow-hidden bg-[#0757ff] px-6 pb-24 pt-36 sm:px-10 lg:min-h-[820px]"
      >
        {/* Background */}

        <div className="pointer-events-none absolute inset-0">

          <motion.div
            className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-[150px]"
            animate={{
              scale: [0.9, 1.08, 0.9],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute left-[8%] top-[35%] h-[240px] w-[240px] rounded-full bg-white/10 blur-[110px]"
            animate={{
              x: [0, 45, 0],
              y: [0, -25, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute right-[8%] top-[25%] h-[270px] w-[270px] rounded-full bg-blue-300/20 blur-[120px]"
            animate={{
              x: [0, -45, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "70px 70px",
              maskImage:
                "radial-gradient(circle at center, black 0%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(circle at center, black 0%, transparent 72%)",
            }}
          />

          <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-black/10 to-transparent" />
        </div>

        {/* Hero content */}

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 flex w-full max-w-[800px] flex-col items-center text-center"
        >

          {/* Eyebrow */}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.6,
            }}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_#67e8f9]" />

            <span className="text-sm font-semibold text-white">
              QR Code & Carte professionnelle
            </span>

            <Sparkles
              size={15}
              className="text-cyan-200"
            />
          </motion.div>

          {/* Brand */}

          <motion.h1
            initial={{
              opacity: 0,
              scale: 0.92,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.25,
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-[72px] font-bold leading-[0.9] tracking-[-0.075em] sm:text-[100px] lg:text-[128px]"
          >
            <span className="text-white">Mon</span>
            <span className="text-white/70">Code</span>
          </motion.h1>

          {/* Main title */}

          <motion.h2
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4,
              duration: 0.7,
            }}
            className="mt-7 max-w-[700px] text-3xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl"
          >
            Votre identité professionnelle.
            <br />
            <span className="text-white/55">
              Un simple scan.
            </span>
          </motion.h2>

          {/* Description */}

          <motion.p
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.5,
              duration: 0.7,
            }}
            className="mt-7 max-w-[620px] text-base leading-7 text-white/65 sm:text-lg sm:leading-8"
          >
            Créez votre carte professionnelle et générez votre
            QR Code en quelques secondes. Téléchargez-le,
            imprimez-le ou partagez-le directement avec vos contacts.
          </motion.p>

          {/* CTA */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.65,
              duration: 0.7,
            }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/carte-visite"
              className="group flex h-16 items-center gap-5 rounded-2xl bg-white px-7 text-base font-bold text-[#05080c] shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(0,0,0,0.25)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0757ff] text-white transition group-hover:scale-105">
                <QrCode size={19} />
              </span>

              <span>
                Générer mon Code QR
              </span>

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/connexion"
              className="flex h-16 items-center gap-3 rounded-2xl border border-white/20 bg-[#05080c] px-7 text-base font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-[#111]"
            >
              Espace Pro

              <ChevronRight size={18} />
            </Link>
          </motion.div>

          {/* Features */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.8,
              duration: 0.7,
            }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4"
          >
            <div className="flex items-center gap-2.5 text-sm font-medium text-white/60">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                <Zap
                  size={13}
                  className="text-cyan-200"
                />
              </span>

              Génération instantanée
            </div>

            <span className="hidden h-4 w-px bg-white/15 sm:block" />

            <div className="flex items-center gap-2.5 text-sm font-medium text-white/60">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                <QrCode
                  size={13}
                  className="text-cyan-200"
                />
              </span>

              Haute définition
            </div>

            <span className="hidden h-4 w-px bg-white/15 sm:block" />

            <div className="flex items-center gap-2.5 text-sm font-medium text-white/60">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                <Lock
                  size={13}
                  className="text-cyan-200"
                />
              </span>

              Partage sécurisé
            </div>
          </motion.div>

          {/* Floating confirmation */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: [0, -6, 0],
            }}
            transition={{
              opacity: {
                delay: 1,
                duration: 0.6,
              },
              y: {
                delay: 1,
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="mt-14 hidden items-center gap-3 rounded-2xl border border-white/15 bg-[#05080c]/40 px-5 py-3.5 shadow-2xl backdrop-blur-xl sm:flex"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white">
              <Check
                size={17}
                className="text-[#0757ff]"
              />
            </div>

            <div className="text-left">
              <p className="text-xs font-semibold text-white">
                Votre carte est prête
              </p>

              <p className="mt-0.5 text-[11px] text-white/40">
                Téléchargez et partagez votre QR Code
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* =========================================================
          SOLUTIONS
      ========================================================= */}

      <section
        id="solutions"
        className="relative bg-[#f8faff] px-6 py-28 sm:px-10 lg:px-14 lg:py-36"
      >
        <div className="mx-auto max-w-[1280px]">

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.7,
            }}
            className="max-w-[700px]"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0757ff]">
              Une plateforme simple
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#05080c] sm:text-5xl lg:text-6xl">
              Tout ce dont votre présence digitale a besoin.
            </h2>

            <p className="mt-6 max-w-[600px] text-base leading-7 text-[#667085] sm:text-lg">
              MonCode rassemble vos informations professionnelles
              dans une expérience simple, moderne et immédiatement
              partageable.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                {...feature}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FONCTIONNEMENT
      ========================================================= */}

      <section
        id="fonctionnement"
        className="relative overflow-hidden bg-white px-6 py-28 sm:px-10 lg:px-14 lg:py-36"
      >
        <div className="pointer-events-none absolute right-[-200px] top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#0757ff]/5 blur-[120px]" />

        <div className="relative mx-auto max-w-[1280px]">

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.7,
            }}
            className="text-center"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0757ff]">
              Fonctionnement
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#05080c] sm:text-5xl lg:text-6xl">
              Trois étapes.
              <br />
              Une expérience.
            </h2>

            <p className="mx-auto mt-6 max-w-[600px] text-base leading-7 text-[#667085] sm:text-lg">
              Pas de configuration compliquée.
              Votre identité professionnelle est prête en quelques instants.
            </p>
          </motion.div>

          <div className="mt-20 grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                  }}
                  className="relative rounded-[30px] border border-[#e6eaf2] bg-white p-8 shadow-[0_15px_50px_rgba(5,8,12,0.04)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0757ff] text-white">
                      <Icon
                        size={23}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span className="text-sm font-bold tracking-widest text-[#0757ff]">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-9 text-2xl font-semibold tracking-[-0.04em] text-[#05080c]">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-[15px] leading-7 text-[#667085]">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <div className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#e6eaf2] bg-white lg:grid">
                      <ChevronRight
                        size={17}
                        className="text-[#0757ff]"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================= */}

      <section
        id="espace"
        className="relative overflow-hidden bg-[#0757ff] px-6 py-24 sm:px-10 lg:px-14 lg:py-32"
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "70px 70px",
            }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-[140px]"
            animate={{
              scale: [0.9, 1.1, 0.9],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.7,
          }}
          className="relative mx-auto flex max-w-[900px] flex-col items-center text-center"
        >
          <div className="mb-7 grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur">
            <QrCode size={28} />
          </div>

          <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Votre activité mérite
            <br />
            une belle présence.
          </h2>

          <p className="mt-6 max-w-[600px] text-base leading-7 text-white/65 sm:text-lg">
            Créez votre identité professionnelle avec MonCode
            et donnez à vos contacts une façon simple de vous retrouver.
          </p>

          <Link
            href="/carte-visite"
            className="group mt-10 flex h-16 items-center gap-4 rounded-2xl bg-[#05080c] px-7 text-base font-bold text-white shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-[#111]"
          >
            Créer mon MonCode

            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0757ff]">
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="bg-[#0757ff] px-6 pb-10 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1280px] border-t border-white/15 pt-8">

          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">

            <Link
              href="/"
              className="text-xl font-bold tracking-[-0.06em] text-white"
            >
              Mon<span className="text-white/60">Code</span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                href="#solutions"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Solutions
              </Link>

              <Link
                href="#fonctionnement"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Fonctionnement
              </Link>

              <Link
                href="/connexion"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Connexion
              </Link>
            </div>

            <p className="text-sm text-white/45">
              © {new Date().getFullYear()} MonCode
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center text-center">
            <p className="text-xs text-white/35">
              Scannez. Partagez. Connectez-vous.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}