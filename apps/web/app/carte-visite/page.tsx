"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useId, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  QrCode,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";

interface QrResult {
  slug: string;
  cardUrl: string;
  qrCode: string;
  imageUrl: string;
}

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
/* BACKGROUND                                                                  */
/* -------------------------------------------------------------------------- */

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-[280px] top-[80px] h-[650px] w-[650px] rounded-full bg-cyan-300/20 blur-[150px]"
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
        className="absolute -right-[300px] top-[300px] h-[700px] w-[700px] rounded-full bg-blue-300/20 blur-[160px]"
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
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "linear-gradient(to bottom, black 0%, transparent 80%)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* QR FRAME                                                                    */
/* -------------------------------------------------------------------------- */

function QRFrame({ qrCode }: { qrCode: string }) {
  return (
    <div className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-[30px] bg-[#05080c] p-8 sm:min-h-[470px]">
      {/* Glow */}
      <motion.div
        className="absolute h-[260px] w-[260px] rounded-full bg-cyan-300/20 blur-[100px]"
        animate={{
          scale: [0.8, 1.1, 0.8],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbit */}
      <motion.div
        className="absolute h-[330px] w-[330px] rounded-full border border-white/10 sm:h-[390px] sm:w-[390px]"
        animate={{ rotate: 360 }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute h-[270px] w-[270px] rounded-full border border-white/[0.06] sm:h-[320px] sm:w-[320px]"
        animate={{ rotate: -360 }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Corner frame */}
      <div className="absolute inset-8 sm:inset-12">
        <span className="absolute left-0 top-0 h-14 w-14 border-l border-t border-white/30" />
        <span className="absolute right-0 top-0 h-14 w-14 border-r border-t border-white/30" />
        <span className="absolute bottom-0 left-0 h-14 w-14 border-b border-l border-white/30" />
        <span className="absolute bottom-0 right-0 h-14 w-14 border-b border-r border-white/30" />
      </div>

      {/* QR */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-20 rounded-[26px] bg-white p-5 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-7"
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="QR Code de votre carte de visite"
            className="block h-[220px] w-[220px] sm:h-[280px] sm:w-[280px]"
          />

          {/* Scan */}
          <motion.div
            className="pointer-events-none absolute -left-5 -right-5 z-30 h-[3px] bg-white shadow-[0_0_8px_#fff,0_0_25px_#67e8f9,0_0_55px_#22d3ee]"
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
        </div>
      </motion.div>

      {/* Active badge */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-5 top-5 z-30 rounded-2xl border border-white/10 bg-[#05080c]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:right-8 sm:top-8"
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_15px_#6ee7b7]" />

          <div>
            <p className="text-xs font-semibold text-white">
              QR actif
            </p>

            <p className="mt-0.5 text-[11px] text-white/45">
              Carte en ligne
            </p>
          </div>
        </div>
      </motion.div>

      {/* Scan badge */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-5 left-5 z-30 rounded-2xl bg-white px-4 py-3 shadow-2xl sm:bottom-8 sm:left-8"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0757ff] text-white">
            <QrCode size={18} />
          </div>

          <div>
            <p className="text-xs font-semibold text-black">
              Prêt à scanner
            </p>

            <p className="mt-0.5 text-[11px] text-neutral-500">
              Partagez votre carte
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

export default function CarteVisitePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<QrResult | null>(null);
  const [copied, setCopied] = useState(false);

  const inputId = useId();

  /* ---------------------------------------------------------------------- */
  /* FILE                                                                    */
  /* ---------------------------------------------------------------------- */

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setQrResult(null);
    setError(null);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl(null);
    setQrResult(null);
    setError(null);
  };

  /* ---------------------------------------------------------------------- */
  /* GENERATE                                                               */
  /* ---------------------------------------------------------------------- */

  const handleGenerateQr = async () => {
    if (!file) return;

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("themeId", "direct");

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5500";

      const response = await fetch(`${apiUrl}/cards`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errData.message ||
            "Erreur lors de la génération du QR code"
        );
      }

      const data: QrResult = await response.json();

      setQrResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de joindre le serveur";

      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* COPY                                                                    */
  /* ---------------------------------------------------------------------- */

  const handleCopyLink = async () => {
    if (!qrResult) return;

    try {
      await navigator.clipboard.writeText(
        qrResult.cardUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  /* ---------------------------------------------------------------------- */
  /* RESULT                                                                  */
  /* ---------------------------------------------------------------------- */

  if (qrResult) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#0757ff] font-sans text-white">
        <Background />

        {/* HEADER */}
        <header className="relative z-50 mx-auto flex h-[92px] max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-14">
          <Link href="/" aria-label="Visicard">
            <Logo className="w-[150px] sm:w-[175px]" />
          </Link>

          <Link
            href="/"
            className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition hover:bg-white/15"
          >
            <ArrowLeft size={16} />
            Accueil
          </Link>
        </header>

        {/* RESULT */}
        <section className="relative z-10 mx-auto grid min-h-[calc(100vh-162px)] max-w-[1280px] items-center gap-14 px-6 pb-20 pt-10 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-md">
              <Check
                size={17}
                className="text-emerald-300"
              />

              <span className="text-sm font-semibold">
                QR Code généré avec succès
              </span>
            </div>

            <h1 className="text-[60px] font-bold leading-[0.91] tracking-[-0.07em] sm:text-[78px] lg:text-[92px]">
              C&apos;est
              <br />
              <span className="text-white/70">
                prêt.
              </span>
            </h1>

            <p className="mt-8 max-w-[500px] text-lg leading-8 text-white/65">
              Votre carte de visite est maintenant accessible
              depuis ce QR Code. Vous pouvez le télécharger,
              partager le lien ou tester votre carte.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={qrResult.qrCode}
                download={`visicard-${qrResult.slug}.png`}
                className="group flex h-14 items-center justify-center gap-4 rounded-xl bg-white px-6 text-sm font-bold text-[#05080c] shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
              >
                <Download size={18} />
                Télécharger
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-14 items-center justify-center gap-3 rounded-xl border border-white/20 bg-black px-6 text-sm font-bold transition hover:-translate-y-1 hover:bg-[#111]"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Lien copié
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copier le lien
                  </>
                )}
              </button>
            </div>

            <a
              href={qrResult.cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
            >
              Tester le rendu direct
              <ExternalLink size={15} />
            </a>

            <button
              type="button"
              onClick={handleRemove}
              className="mt-8 flex items-center gap-2 text-sm font-medium text-white/45 transition hover:text-white"
            >
              <RefreshCw size={15} />
              Générer une autre carte
            </button>
          </motion.div>

          {/* QR */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.88,
              x: 40,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <QRFrame qrCode={qrResult.qrCode} />

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-md">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Lien de votre carte
              </p>

              <code className="block break-all text-sm text-white/80">
                {qrResult.cardUrl}
              </code>
            </div>
          </motion.div>
        </section>

        <footer className="relative z-20 border-t border-white/10 px-6 py-7 sm:px-10 lg:px-14">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <span className="text-xs font-semibold text-white/40">
              VISICARD
            </span>

            <span className="text-xs text-white/35">
              Votre identité. En un scan.
            </span>
          </div>
        </footer>
      </main>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* UPLOAD PAGE                                                             */
  /* ---------------------------------------------------------------------- */

  return (
    <main className="min-h-screen overflow-hidden bg-[#0757ff] font-sans text-white">
      <Background />

      {/* HEADER */}
      <header className="relative z-50 mx-auto flex h-[92px] max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-14">
        <Link href="/" aria-label="Visicard">
          <Logo className="w-[150px] sm:w-[175px]" />
        </Link>

        <div className="hidden items-center gap-2 text-sm font-medium text-white/55 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_15px_#6ee7b7]" />
          Service disponible
        </div>

        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition hover:bg-white/15"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">
            Retour
          </span>
        </Link>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-162px)] max-w-[1440px] items-center gap-14 px-6 pb-20 pt-10 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
        {/* LEFT */}
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

            <span className="text-sm font-semibold">
              Carte de visite digitale
            </span>
          </div>

          <h1 className="max-w-[760px] text-[58px] font-bold leading-[0.94] tracking-[-0.07em] sm:text-[76px] lg:text-[92px]">
            Votre carte.
            <br />

            <span className="text-white/70">
              En un scan.
            </span>
          </h1>

          <p className="mt-9 max-w-[600px] text-lg leading-8 text-white/65 sm:text-xl">
            Importez simplement votre carte de visite.
            Visicard génère un QR Code qui permet de
            l&apos;afficher instantanément sur n&apos;importe quel
            téléphone.
          </p>

          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4">
            <div className="flex items-center gap-2.5 text-sm font-medium text-white/55">
              <Check size={17} />
              Simple
            </div>

            <div className="flex items-center gap-2.5 text-sm font-medium text-white/55">
              <Check size={17} />
              Instantané
            </div>

            <div className="flex items-center gap-2.5 text-sm font-medium text-white/55">
              <Check size={17} />
              Accessible partout
            </div>
          </div>
        </motion.div>

        {/* RIGHT CARD */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
            x: 40,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
          }}
          transition={{
            duration: 0.9,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-20"
        >
          <div className="rounded-[32px] border border-white/10 bg-white p-6 text-[#05080c] shadow-[0_40px_100px_rgba(0,0,0,0.2)] sm:p-8">
            {/* CARD HEADER */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0757ff]">
                  Carte de visite
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em]">
                  Importez votre carte
                </h2>
              </div>

              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf4ff] text-[#0757ff]">
                <ImagePlus size={22} />
              </div>
            </div>

            {/* UPLOAD */}
            <div className="mt-7">
              <input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div>
                  <div className="group relative overflow-hidden rounded-[24px] bg-[#f1f4f9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Aperçu de votre carte de visite"
                      className="block aspect-[1.7] w-full object-contain"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isGenerating}
                        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black shadow-xl"
                      >
                        Changer l&apos;image
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f5f7fa] p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0757ff] text-white">
                      <Check size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {file?.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {file
                          ? `${(file.size / 1024).toFixed(1)} Ko`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isGenerating}
                      className="ml-auto shrink-0 text-xs font-semibold text-[#0757ff]"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={inputId}
                  className="group relative flex min-h-[330px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[26px] border-2 border-dashed border-[#d8dfeb] bg-[#f8faff] px-6 text-center transition hover:border-[#0757ff] hover:bg-[#f1f6ff]"
                >
                  <motion.div
                    whileHover={{ y: -5, scale: 1.04 }}
                    className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e8f1ff] text-[#0757ff]"
                  >
                    <Upload size={27} />
                  </motion.div>

                  <h3 className="mt-6 text-lg font-bold">
                    Choisir ma carte de visite
                  </h3>

                  <p className="mt-2 max-w-[340px] text-sm leading-6 text-[#667085]">
                    Glissez votre image ici ou cliquez pour
                    sélectionner votre fichier.
                  </p>

                  <div className="mt-6 flex gap-2">
                    {["PNG", "JPG", "WEBP"].map(
                      (format) => (
                        <span
                          key={format}
                          className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold tracking-wide text-[#667085] shadow-sm"
                        >
                          {format}
                        </span>
                      )
                    )}
                  </div>

                  <span className="absolute right-5 top-5 text-[#0757ff] opacity-0 transition group-hover:opacity-100">
                    <ArrowRight size={20} />
                  </span>
                </label>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-100 font-bold">
                  !
                </span>

                {error}
              </motion.div>
            )}

            {/* GENERATE */}
            <button
              type="button"
              onClick={handleGenerateQr}
              disabled={!file || isGenerating}
              className="group mt-5 flex h-16 w-full items-center justify-between rounded-2xl bg-[#05080c] px-6 text-sm font-bold text-white shadow-[0_15px_35px_rgba(5,8,12,0.18)] transition hover:-translate-y-0.5 hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-3">
                {isGenerating ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <RefreshCw size={18} />
                    </motion.span>

                    Génération en cours...
                  </>
                ) : (
                  <>
                    <QrCode size={19} />
                    Générer mon QR Code
                  </>
                )}
              </span>

              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black transition group-hover:translate-x-1">
                <ArrowRight size={18} />
              </span>
            </button>

            <p className="mt-4 text-center text-xs text-[#98a2b3]">
              Votre image sera utilisée uniquement pour
              générer votre carte digitale.
            </p>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-white/10 px-6 py-7 sm:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <span className="text-xs font-semibold text-white/40">
            VISICARD
          </span>

          <span className="text-xs text-white/35">
            Votre identité. En un scan.
          </span>
        </div>
      </footer>
    </main>
  );
}
