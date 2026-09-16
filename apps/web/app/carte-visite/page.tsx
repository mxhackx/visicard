"use client";

import {
useId,
useState,
ChangeEvent,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
ArrowLeft,
ArrowRight,
Check,
Copy,
Download,
ExternalLink,
FileImage,
ImagePlus,
Loader2,
QrCode,
RefreshCcw,
ShieldCheck,
Sparkles,
Upload,
X,
Zap,
} from "lucide-react";

interface QrResult {
slug: string;
cardUrl: string;
qrCode: string;
imageUrl: string;
}

export default function CarteVisitePage() {
const [file, setFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [isGenerating, setIsGenerating] = useState(false);
const [error, setError] = useState<string | null>(null);
const [qrResult, setQrResult] = useState<QrResult | null>(null);
const [copied, setCopied] = useState(false);

const inputId = useId();

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
const selected = e.target.files?.[0];

```
if (!selected) return;

if (previewUrl) {
  URL.revokeObjectURL(previewUrl);
}

setFile(selected);
setPreviewUrl(URL.createObjectURL(selected));
setQrResult(null);
setError(null);
```

};

const handleRemove = () => {
if (previewUrl) {
URL.revokeObjectURL(previewUrl);
}

```
setFile(null);
setPreviewUrl(null);
setQrResult(null);
setError(null);
```

};

const handleGenerateQr = async () => {
if (!file) return;

```
setIsGenerating(true);
setError(null);

try {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("themeId", "direct");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5500";

  const response = await fetch(
    `${apiUrl}/cards/visite`,
    {
      credentials: "include",
      method: "POST",
      body: formData,
    }
  );

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
```

};

const handleCopyLink = async () => {
if (!qrResult) return;

```
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
```

};

const handleReset = () => {
if (previewUrl) {
URL.revokeObjectURL(previewUrl);
}

```
setFile(null);
setPreviewUrl(null);
setQrResult(null);
setError(null);
setCopied(false);
```

};

return ( <main className="relative min-h-screen overflow-hidden bg-[#f8faff] text-[#05080c]">

```
  {/* =========================================================
      BACKGROUND
  ========================================================= */}

  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#0757ff]/10 blur-[140px]" />

    <div className="absolute bottom-[-200px] right-[-150px] h-[450px] w-[450px] rounded-full bg-cyan-300/10 blur-[130px]" />

    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(#0757ff 1px, transparent 1px), linear-gradient(90deg, #0757ff 1px, transparent 1px)",
        backgroundSize: "70px 70px",
      }}
    />
  </div>

  {/* =========================================================
      HEADER
  ========================================================= */}

  <header className="relative z-20 border-b border-[#e6eaf2]/80 bg-white/75 backdrop-blur-xl">
    <div className="mx-auto flex h-[82px] max-w-[1280px] items-center justify-between px-6 sm:px-10">

      <Link
        href="/"
        aria-label="MonCode - accueil"
        className="group"
      >
        <span className="text-[25px] font-bold tracking-[-0.06em] text-[#05080c]">
          Mon
          <span className="text-[#0757ff]">
            Code
          </span>
        </span>
      </Link>

      <Link
        href="/"
        className="group flex items-center gap-2 rounded-full border border-[#e6eaf2] bg-white px-4 py-2.5 text-sm font-semibold text-[#05080c] shadow-sm transition hover:border-[#0757ff]/30 hover:text-[#0757ff]"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-0.5"
        />

        Retour à l'accueil
      </Link>
    </div>
  </header>

  {/* =========================================================
      MAIN
  ========================================================= */}

  <section className="relative z-10 px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24">

    <div className="mx-auto max-w-[1100px]">

      <AnimatePresence mode="wait">

        {/* =====================================================
            RESULT
        ===================================================== */}

        {qrResult ? (
          <motion.div
            key="result"
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto max-w-[850px]"
          >

            {/* Success header */}

            <div className="text-center">

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: 0.1,
                  duration: 0.5,
                }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#0757ff] text-white shadow-[0_15px_40px_rgba(7,87,255,0.25)]"
              >
                <Check size={28} />
              </motion.div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#0757ff]">
                QR Code prêt
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-[#05080c] sm:text-5xl">
                Votre QR Code est
                <br />
                <span className="text-[#0757ff]">
                  prêt à être partagé.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-[600px] text-base leading-7 text-[#667085]">
                Toute personne qui scanne ce code
                accèdera directement à votre carte
                de visite.
              </p>
            </div>

            {/* Result card */}

            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.85fr]">

              {/* QR */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                }}
                className="rounded-[32px] border border-[#e6eaf2] bg-white p-6 shadow-[0_25px_80px_rgba(5,8,12,0.08)] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#05080c]">
                      Votre QR Code
                    </p>

                    <p className="mt-1 text-xs text-[#98a2b3]">
                      Haute définition
                    </p>
                  </div>

                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4ff] text-[#0757ff]">
                    <QrCode size={19} />
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-[0_15px_50px_rgba(5,8,12,0.06)] sm:p-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrResult.qrCode}
                      alt={`QR Code pour la carte ${qrResult.slug}`}
                      className="block h-auto w-[220px] sm:w-[260px]"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#667085]">
                  <ShieldCheck
                    size={15}
                    className="text-[#0757ff]"
                  />

                  Votre QR Code est prêt à être utilisé.
                </div>
              </motion.div>

              {/* Actions */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: 0.3,
                  duration: 0.6,
                }}
                className="flex flex-col rounded-[32px] bg-[#05080c] p-7 text-white sm:p-8"
              >

                <div>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0757ff]">
                    <Zap size={19} />
                  </div>

                  <h2 className="mt-7 text-2xl font-semibold tracking-[-0.04em]">
                    Votre carte est en ligne.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/50">
                    Utilisez le lien ci-dessous pour
                    partager directement votre carte.
                  </p>
                </div>

                {/* Link */}

                <div className="mt-8">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/35">
                    Lien direct
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="break-all text-xs leading-5 text-white/70">
                      {qrResult.cardUrl}
                    </p>
                  </div>
                </div>

                {/* Buttons */}

                <div className="mt-auto space-y-3 pt-8">

                  <a
                    href={qrResult.qrCode}
                    download={`moncode-${qrResult.slug}.png`}
                    className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 text-sm font-bold text-[#05080c] transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <Download size={18} />

                    Télécharger le QR Code

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {copied ? (
                      <>
                        <Check
                          size={18}
                          className="text-cyan-300"
                        />

                        Lien copié !
                      </>
                    ) : (
                      <>
                        <Copy size={18} />

                        Copier le lien
                      </>
                    )}
                  </button>

                  <a
                    href={qrResult.cardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-transparent px-5 text-sm font-semibold text-white transition hover:bg-white/5"
                  >
                    <ExternalLink size={17} />

                    Tester le rendu
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Reset */}

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="group flex items-center gap-2 text-sm font-semibold text-[#667085] transition hover:text-[#0757ff]"
              >
                <RefreshCcw
                  size={15}
                  className="transition-transform group-hover:rotate-180"
                />

                Générer une autre carte
              </button>
            </div>
          </motion.div>
        ) : (

          /* ===================================================
             UPLOAD
          =================================================== */

          <motion.div
            key="upload"
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto max-w-[850px]"
          >

            {/* Header */}

            <div className="text-center">

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: 0.1,
                  duration: 0.5,
                }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#0757ff] text-white shadow-[0_15px_40px_rgba(7,87,255,0.22)]"
              >
                <QrCode size={28} />
              </motion.div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#0757ff]">
                Mode Express Direct
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-[#05080c] sm:text-5xl lg:text-6xl">
                Transformez votre carte
                <br />
                <span className="text-[#0757ff]">
                  en QR Code.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-[620px] text-base leading-7 text-[#667085] sm:text-lg">
                Importez simplement l'image de votre
                carte de visite. MonCode génère un QR
                Code qui donne directement accès à votre
                carte.
              </p>
            </div>

            {/* Upload card */}

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
                delay: 0.25,
                duration: 0.6,
              }}
              className="mt-12 rounded-[32px] border border-[#e6eaf2] bg-white p-5 shadow-[0_25px_80px_rgba(5,8,12,0.07)] sm:p-8"
            >

              {!previewUrl ? (

                <div>
                  <input
                    id={inputId}
                    type="file"
                    accept="image/png,image/jpeg,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={handleFileChange}
                  />

                  <label
                    htmlFor={inputId}
                    className="group flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-[#dce3ef] bg-[#f8faff] px-6 text-center transition duration-300 hover:border-[#0757ff]/50 hover:bg-[#edf4ff]/50"
                  >

                    <motion.div
                      whileHover={{
                        scale: 1.05,
                        y: -3,
                      }}
                      className="grid h-20 w-20 place-items-center rounded-[24px] bg-[#0757ff] text-white shadow-[0_15px_35px_rgba(7,87,255,0.2)]"
                    >
                      <Upload size={30} />
                    </motion.div>

                    <h2 className="mt-7 text-xl font-semibold tracking-[-0.03em] text-[#05080c]">
                      Choisir ma carte de visite
                    </h2>

                    <p className="mt-3 max-w-[420px] text-sm leading-6 text-[#667085]">
                      Cliquez ici pour sélectionner votre
                      image ou glissez-la directement dans
                      cette zone.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {[
                        "PNG",
                        "JPG",
                        "WEBP",
                      ].map((format) => (
                        <span
                          key={format}
                          className="rounded-full border border-[#e6eaf2] bg-white px-3 py-1.5 text-[11px] font-bold text-[#667085]"
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                  </label>
                </div>

              ) : (

                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="relative overflow-hidden rounded-[26px] bg-[#05080c]"
                >

                  <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                    <Check
                      size={14}
                      className="text-cyan-300"
                    />

                    Image sélectionnée
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Aperçu de votre carte de visite"
                    className="mx-auto max-h-[460px] w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isGenerating}
                    className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#05080c] shadow-xl transition hover:bg-[#edf4ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={14} />

                    Changer
                  </button>
                </motion.div>
              )}

              {/* File information */}

              {file && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-5 flex items-center gap-4 rounded-2xl border border-[#e6eaf2] bg-[#f8faff] p-4"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#0757ff]">
                    <FileImage size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#05080c]">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-[#98a2b3]">
                      {(file.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error */}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="mt-5 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <div className="mt-0.5">
                        <X size={17} />
                      </div>

                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate */}

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerateQr}
                  disabled={!file || isGenerating}
                  className="group flex h-16 w-full max-w-[420px] items-center justify-center gap-4 rounded-2xl bg-[#0757ff] px-7 text-base font-bold text-white shadow-[0_18px_45px_rgba(7,87,255,0.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0049df] hover:shadow-[0_22px_55px_rgba(7,87,255,0.28)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />

                      Génération du QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode size={20} />

                      Générer mon QR Code

                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Information row */}

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
                delay: 0.45,
                duration: 0.6,
              }}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-white p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#0757ff]">
                  <Zap size={18} />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#05080c]">
                    Instantané
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#98a2b3]">
                    Génération rapide
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-white p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#0757ff]">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#05080c]">
                    Sécurisé
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#98a2b3]">
                    Vos données protégées
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-white p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#0757ff]">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#05080c]">
                    Haute qualité
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#98a2b3]">
                    QR Code prêt à imprimer
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bottom note */}

            <p className="mt-8 text-center text-xs text-[#98a2b3]">
              Votre carte sera accessible directement
              après le scan du QR Code.
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  </section>

  {/* =========================================================
      FOOTER
  ========================================================= */}

  <footer className="relative z-10 border-t border-[#e6eaf2] bg-white px-6 py-7 sm:px-10">
    <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 sm:flex-row">

      <Link
        href="/"
        className="text-lg font-bold tracking-[-0.06em] text-[#05080c]"
      >
        Mon
        <span className="text-[#0757ff]">
          Code
        </span>
      </Link>

      <div className="flex items-center gap-2 text-xs text-[#98a2b3]">
        <QrCode size={14} className="text-[#0757ff]" />

        Scannez. Partagez. Connectez-vous.
      </div>

      <p className="text-xs text-[#98a2b3]">
        © {new Date().getFullYear()} MonCode
      </p>
    </div>
  </footer>
</main>
```

);
}
