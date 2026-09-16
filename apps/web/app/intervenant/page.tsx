"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  FileText,
  UserRound,
} from "lucide-react";
import { useFile, UserInfo } from "../context/FileContext";

export default function IntervenantPage() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useFile();
  const [formError, setFormError] = useState<string | null>(null);

  const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));

    if (formError) {
      setFormError(null);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (
      !userInfo.userName.trim() ||
      !userInfo.clientName.trim() ||
      !userInfo.workDone.trim() ||
      !userInfo.amountReceived.trim()
    ) {
      setFormError(
        "Veuillez remplir tous les champs obligatoires avant de continuer."
      );
      return;
    }

    setFormError(null);
    router.push("/restaurant");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#05080c]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#0757ff]/[0.055] blur-[110px]" />
        <div className="absolute -right-40 top-[20%] h-[520px] w-[520px] rounded-full bg-cyan-300/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[30%] h-[500px] w-[500px] rounded-full bg-[#0757ff]/[0.045] blur-[120px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.3]"
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
          <p className="text-[12px] font-semibold text-[#596579]">
            Vos menus digitaux, en un scan.
          </p>
        </div>
      </header>

      {/* Main */}
      <section className="relative z-10 px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto w-full max-w-[920px]"
        >
          {/* Top navigation */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/choix-profil"
              className="group inline-flex items-center gap-2 rounded-full border border-[#e6eaf2] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#596579] shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition-all hover:border-[#0757ff]/30 hover:text-[#0757ff]"
            >
              <ArrowLeft
                size={15}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span className="hidden sm:inline">
                Retour au choix du profil
              </span>
              <span className="sm:hidden">Retour</span>
            </Link>

            {/* Progress */}
            <div className="flex items-center gap-2 rounded-full border border-[#0757ff]/15 bg-[#0757ff]/[0.05] px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0757ff] text-[10px] font-bold text-white">
                  1
                </span>
                <span className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-[#0757ff] sm:block">
                  Étape 1
                </span>
              </div>

              <span className="text-[#b9c1cd]">/</span>

              <span className="text-[11px] font-semibold text-[#9aa4b4]">
                3
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10 max-w-[700px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0757ff]/15 bg-[#0757ff]/[0.06] px-4 py-2"
            >
              <FileText size={14} className="text-[#0757ff]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0757ff]">
                Fiche d&apos;intervention
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[42px] font-bold leading-[0.96] tracking-[-0.065em] text-[#05080c] sm:text-[56px]"
            >
              Fiche{" "}
              <span className="text-[#0757ff]">Intervenant</span>
              <br className="hidden sm:block" /> &amp; Client.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-5 max-w-[590px] text-[15px] leading-7 text-[#687386] sm:text-[16px]"
            >
              Renseignez les détails ci-dessous avant d&apos;accéder à la
              saisie du restaurant et de son menu.
            </motion.p>
          </div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="relative overflow-hidden rounded-[32px] border border-[#e3e8f0] bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.07)] sm:p-9 lg:p-10"
          >
            {/* Top accent */}
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-[#0757ff]" />

            <div className="mb-9 flex items-center gap-4 border-b border-[#edf0f5] pb-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#0757ff]/[0.08] text-[#0757ff]">
                <UserRound size={20} />
              </div>

              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#05080c]">
                  Informations de l&apos;intervention
                </h2>
                <p className="mt-0.5 text-[12px] text-[#8b95a5]">
                  Les champs marqués d&apos;un * sont obligatoires.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Names */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="user-name"
                    className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[#596579]"
                  >
                    Nom et prénoms de l&apos;intervenant *
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5afbd]"
                    />

                    <input
                      id="user-name"
                      type="text"
                      placeholder="Ex : Jean Dupont"
                      value={userInfo.userName}
                      onChange={(e) =>
                        handleUserInfoChange("userName", e.target.value)
                      }
                      required
                      className="h-[54px] w-full rounded-[15px] border border-[#dfe5ee] bg-[#fbfcfe] pl-11 pr-4 text-[14px] font-medium text-[#05080c] outline-none transition-all placeholder:text-[#a5afbd] focus:border-[#0757ff] focus:bg-white focus:ring-4 focus:ring-[#0757ff]/[0.08]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="client-name"
                    className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[#596579]"
                  >
                    Nom complet du client *
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5afbd]"
                    />

                    <input
                      id="client-name"
                      type="text"
                      placeholder="Ex : Entreprise Alpha / M. Martin"
                      value={userInfo.clientName}
                      onChange={(e) =>
                        handleUserInfoChange("clientName", e.target.value)
                      }
                      required
                      className="h-[54px] w-full rounded-[15px] border border-[#dfe5ee] bg-[#fbfcfe] pl-11 pr-4 text-[14px] font-medium text-[#05080c] outline-none transition-all placeholder:text-[#a5afbd] focus:border-[#0757ff] focus:bg-white focus:ring-4 focus:ring-[#0757ff]/[0.08]"
                    />
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label
                  htmlFor="amount-received"
                  className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[#596579]"
                >
                  Montant reçu *
                </label>

                <div className="relative">
                  <CircleDollarSign
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5afbd]"
                  />

                  <input
                    id="amount-received"
                    type="text"
                    placeholder="Ex : 50 000 FCFA ou 150 €"
                    value={userInfo.amountReceived}
                    onChange={(e) =>
                      handleUserInfoChange("amountReceived", e.target.value)
                    }
                    required
                    className="h-[54px] w-full rounded-[15px] border border-[#dfe5ee] bg-[#fbfcfe] pl-11 pr-4 text-[14px] font-medium text-[#05080c] outline-none transition-all placeholder:text-[#a5afbd] focus:border-[#0757ff] focus:bg-white focus:ring-4 focus:ring-[#0757ff]/[0.08]"
                  />
                </div>
              </div>

              {/* Work */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="work-done"
                    className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[#596579]"
                  >
                    Travaux effectués *
                  </label>

                  <span className="hidden text-[11px] font-medium text-[#a5afbd] sm:block">
                    Décrivez brièvement la prestation
                  </span>
                </div>

                <textarea
                  id="work-done"
                  placeholder="Ex : Conception du menu digital, configuration QR Code, impression du support..."
                  value={userInfo.workDone}
                  onChange={(e) =>
                    handleUserInfoChange("workDone", e.target.value)
                  }
                  rows={4}
                  required
                  className="w-full resize-none rounded-[15px] border border-[#dfe5ee] bg-[#fbfcfe] px-4 py-4 text-[14px] font-medium leading-6 text-[#05080c] outline-none transition-all placeholder:text-[#a5afbd] focus:border-[#0757ff] focus:bg-white focus:ring-4 focus:ring-[#0757ff]/[0.08]"
                />
              </div>

              {/* Error */}
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-[14px] border border-red-100 bg-red-50 px-4 py-3.5 text-[13px] text-[#b42318]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold">
                    !
                  </span>
                  <span>{formError}</span>
                </motion.div>
              )}

              {/* Submit */}
              <div className="border-t border-[#edf0f5] pt-7">
                <button
                  type="submit"
                  className="group flex h-[56px] w-full items-center justify-center gap-3 rounded-[15px] bg-[#0757ff] px-6 text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(7,87,255,0.2)] transition-all hover:bg-[#004ce6] hover:shadow-[0_16px_40px_rgba(7,87,255,0.25)] active:scale-[0.99]"
                >
                  Continuer vers les informations du restaurant

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Check size={13} className="text-[#0757ff]" />
                  <span className="text-[11px] font-medium text-[#929baa]">
                    Vos informations sont utilisées pour préparer votre fiche.
                  </span>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Steps */}
          <div className="mt-7 flex items-center justify-center gap-2">
            <div className="h-1.5 w-10 rounded-full bg-[#0757ff]" />
            <div className="h-1.5 w-10 rounded-full bg-[#e7ebf1]" />
            <div className="h-1.5 w-10 rounded-full bg-[#e7ebf1]" />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-4 border-t border-[#eef1f6] px-6 py-6">
        <div className="mx-auto flex max-w-[1440px] justify-center">
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