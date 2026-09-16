"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Shield, UserRound } from "lucide-react";
import { useFile } from "../context/FileContext";

export default function ChoixProfilPage() {
  const router = useRouter();
  const { setSelectedRole } = useFile();

  const handleSelectUser = () => {
    setSelectedRole("user");
    router.push("/intervenant");
  };

  const handleSelectAdmin = () => {
    setSelectedRole("admin");
    router.push("/admin");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#05080c]">
      {/* Ambient blue backgrounds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#0757ff]/[0.06] blur-[100px]" />
        <div className="absolute -right-40 top-[20%] h-[500px] w-[500px] rounded-full bg-cyan-300/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-180px] left-[35%] h-[500px] w-[500px] rounded-full bg-[#0757ff]/[0.05] blur-[120px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(7,87,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(7,87,255,0.045) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
        <Link
          href="/"
          aria-label="MonCode - accueil"
          className="group flex items-center"
        >
          <div className="text-[28px] font-black tracking-[-0.07em] text-[#05080c]">
            <span className="text-[#0757ff]">Mon</span>Code
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-[#e6eaf2] bg-white px-4 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0757ff]" />
          <p className="text-[12px] font-semibold tracking-[-0.01em] text-[#596579]">
            Vos menus digitaux, en un scan.
          </p>
        </div>
      </header>

      {/* Main */}
      <section className="relative z-10 flex min-h-[calc(100vh-150px)] items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[920px]"
        >
          {/* Back */}
          <div className="mb-8">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-[#e6eaf2] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#596579] shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition-all hover:border-[#0757ff]/30 hover:text-[#0757ff]"
            >
              <ArrowLeft
                size={15}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Retour à l&apos;accueil
            </Link>
          </div>

          {/* Heading */}
          <div className="mx-auto max-w-[700px] text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0757ff]/15 bg-[#0757ff]/[0.06] px-4 py-2"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0757ff]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>

              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0757ff]">
                Sélectionnez votre espace
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[44px] font-bold leading-[0.96] tracking-[-0.065em] text-[#05080c] sm:text-[58px] lg:text-[68px]"
            >
              Choisissez votre{" "}
              <span className="text-[#0757ff]">profil.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mt-6 max-w-[560px] text-[15px] leading-7 tracking-[-0.01em] text-[#687386] sm:text-[16px]"
            >
              Sélectionnez votre profil d&apos;accès pour accéder à votre
              espace dédié.
            </motion.p>
          </div>

          {/* Profile cards */}
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {/* User */}
            <motion.button
              type="button"
              onClick={handleSelectUser}
              aria-label="Accéder à l'espace Utilisateur"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.55, ease: "easeOut" }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.99 }}
              className="group relative overflow-hidden rounded-[30px] border border-[#e4e9f2] bg-white p-7 text-left shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition-all duration-300 hover:border-[#0757ff]/30 hover:shadow-[0_30px_80px_rgba(7,87,255,0.12)] sm:p-8"
            >
              {/* Blue hover glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#0757ff]/[0.07] blur-3xl transition-all duration-500 group-hover:bg-[#0757ff]/[0.13]" />

              <div className="relative">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[17px] bg-[#0757ff]/[0.08] text-[#0757ff] transition-all duration-300 group-hover:bg-[#0757ff] group-hover:text-white">
                    <UserRound size={24} strokeWidth={2} />
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6eaf2] text-[#9aa4b4] transition-all duration-300 group-hover:border-[#0757ff] group-hover:bg-[#0757ff] group-hover:text-white">
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </div>
                </div>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0757ff]">
                  Espace principal
                </p>

                <h2 className="text-[30px] font-bold tracking-[-0.055em] text-[#05080c]">
                  Utilisateur
                </h2>

                <p className="mt-4 max-w-[390px] text-[14px] leading-6 text-[#687386]">
                  Renseignez votre fiche d&apos;intervention, ajoutez les
                  informations du restaurant et générez votre QR Code de
                  menu.
                </p>

                <div className="mt-8 flex items-center gap-2 text-[13px] font-bold text-[#05080c]">
                  Accéder à l&apos;espace
                  <ArrowRight
                    size={15}
                    className="text-[#0757ff] transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </motion.button>

            {/* Admin */}
            <motion.button
              type="button"
              onClick={handleSelectAdmin}
              aria-label="Accéder à l'espace Administrateur"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38, duration: 0.55, ease: "easeOut" }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.99 }}
              className="group relative overflow-hidden rounded-[30px] border border-[#e4e9f2] bg-[#05080c] p-7 text-left shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all duration-300 hover:border-[#0757ff]/40 hover:shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8"
            >
              {/* Blue glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#0757ff]/20 blur-3xl transition-all duration-500 group-hover:bg-[#0757ff]/30" />

              {/* Subtle grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[17px] bg-white/[0.08] text-white transition-all duration-300 group-hover:bg-[#0757ff]">
                    <Shield size={24} strokeWidth={2} />
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-300 group-hover:border-[#0757ff] group-hover:bg-[#0757ff] group-hover:text-white">
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </div>
                </div>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#5d91ff]">
                  Accès sécurisé
                </p>

                <h2 className="text-[30px] font-bold tracking-[-0.055em] text-white">
                  Administrateur
                </h2>

                <p className="mt-4 max-w-[390px] text-[14px] leading-6 text-white/55">
                  Supervisez la plateforme, consultez les cartes enregistrées
                  et modifiez vos paramètres de sécurité.
                </p>

                <div className="mt-8 flex items-center gap-2 text-[13px] font-bold text-white">
                  Accéder à l&apos;espace
                  <ArrowRight
                    size={15}
                    className="text-[#5d91ff] transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </motion.button>
          </div>

          {/* Bottom reassurance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-center"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#0757ff]" />
            <p className="text-[12px] font-medium text-[#8b95a5]">
              Un espace adapté à chaque type d&apos;utilisateur
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#eef1f6] px-6 py-6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center">
          <p className="text-center text-[11px] font-medium tracking-wide text-[#9aa4b4]">
            Scannez et partagez en un instant
            <span className="mx-2 text-[#d5dae3]">•</span>
            Propulsé par{" "}
            <span className="font-bold text-[#0757ff]">MonCode</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
