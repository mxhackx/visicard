"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LayoutDashboard, CheckCircle2, Download, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useFile } from "../context/FileContext";
import QRCodeStudio from "../../components/QRCodeStudio";

interface QrResult {
  slug: string;
  cardUrl: string;
  qrCode: string; // The base64 or URL of the standard QR returned by backend
  imageUrl: string;
}

export default function QrStudioPage() {
  const router = useRouter();
  const {
    userInfo,
    restaurantInfo,
    customization,
    setQrStyle,
    authToken,
    authRole,
    isAuthLoading,
    resetAll,
    refreshAccessToken,
  } = useFile();

  useEffect(() => {
    if (!isAuthLoading && !authToken) {
      router.push("/connexion");
    }
  }, [authToken, isAuthLoading, router]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<QrResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrName, setQrName] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();

      // Utilisateur (qui paie)
      formData.append("clientName", userInfo.clientName);
      formData.append("userName", userInfo.userName);
      if (userInfo.workDone) formData.append("workDone", userInfo.workDone);
      if (userInfo.amountReceived) formData.append("amountReceived", userInfo.amountReceived);

      // Informations du restaurant
            formData.append("restaurantName", restaurantInfo.restaurantName);
      formData.append("address", restaurantInfo.address || "");
      formData.append("locationUrl", restaurantInfo.locationUrl);
      formData.append("phoneNumber", restaurantInfo.phoneNumber);
      if (restaurantInfo.facebookUrl) formData.append("facebookUrl", restaurantInfo.facebookUrl);
      if (restaurantInfo.instagramUrl) formData.append("instagramUrl", restaurantInfo.instagramUrl);
      if (restaurantInfo.xUrl) formData.append("xUrl", restaurantInfo.xUrl);
      if (restaurantInfo.snapchatUrl) formData.append("snapchatUrl", restaurantInfo.snapchatUrl);
      if (restaurantInfo.additionalInfo) formData.append("additionalInfo", restaurantInfo.additionalInfo);
      formData.append("schedule", JSON.stringify(restaurantInfo.schedule));
      formData.append("themeId", customization.themeId);
      if (customization.cardLayout) formData.append("cardLayout", customization.cardLayout);
      if (customization.qrStyle) formData.append("qrStyle", customization.qrStyle);

      // Logo
      if (restaurantInfo.logoFile) {
        formData.append("logo", restaurantInfo.logoFile);
      }

      
      // Photos du menu
      for (const menuFile of restaurantInfo.menuFiles) {
        formData.append("menu", menuFile);
      }
      
      // Photos du lieu
      for (const placeFile of restaurantInfo.placeFiles) {
        formData.append("place", placeFile);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

      let currentToken = authToken;
      let response = await fetch(`${apiUrl}/cards`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        // Tentative de rafraîchissement
        const newToken = await refreshAccessToken();
        if (newToken) {
          currentToken = newToken;
          response = await fetch(`${apiUrl}/cards`, {
            method: "POST",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
            body: formData,
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la création de la carte (Session peut-être expirée).");
      }

      const data = await response.json();
      setQrResult(data);
    } catch (err: any) {
      console.error("Generate error:", err);
      setError(err.message || "Une erreur est survenue lors de la création.");
    } finally {
      setIsGenerating(false);
    }
  };

  
  const [finalQrCode, setFinalQrCode] = useState<any>(null);

  useEffect(() => {
    if (qrResult && customization.qrStyle) {
      const config = JSON.parse(customization.qrStyle);
      import("qr-code-styling").then((module) => {
        const QRCodeStylingClass = module.default;
        const qr = new QRCodeStylingClass({
        width: 300,
        height: 300,
        data: qrResult.cardUrl,
        image: "",
        dotsOptions: { color: config.color, type: config.dotsType },
        cornersSquareOptions: { color: config.color, type: config.cornersType },
        imageOptions: { crossOrigin: "anonymous", margin: 10 },
      });
      setFinalQrCode(qr);

      const container = document.getElementById("qr-result-container");
      if (container) {
        container.innerHTML = "";
        qr.append(container);
      }
      });
    }
  }, [qrResult, customization.qrStyle]);

  const handleDownloadQr = () => {
    if (finalQrCode) {
      finalQrCode.download({ name: qrName.trim() || `menu-${qrResult?.slug || 'qr'}`, extension: "png" });
    }
  };

  const handleCopyLink = () => {
    if (qrResult) {
      navigator.clipboard.writeText(qrResult.cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isAuthLoading) return null;

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      

            <header className="w-full h-16 border-b bg-white flex items-center justify-between px-6 lg:px-12 sticky top-0 z-20 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5 text-blue-600">
            <img src="/logo.svg" alt="MonCode Logo" className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">MonCode</span>
        </Link>
      </header>

            <section className="relative z-10 w-full px-4 py-8">
        {qrResult ? (

            <div className="flex flex-col items-center max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Menu Numérique Créé !
              </h1>
              <p className="text-slate-500 text-center mb-8 max-w-md">
                Votre carte interactive est prête. Téléchargez le QR Code généré ci-dessous pour l'imprimer ou le partager.
              </p>
              
              <Card className="w-full max-w-md overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/40">
                <CardContent className="p-8 flex flex-col items-center">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 w-full flex justify-center" id="qr-result-container">
                    {/* The QR code will be injected here via useEffect */}
                  </div>
                  
                  <div className="w-full flex flex-col gap-3">
                    <Button 
                      onClick={handleDownloadQr} 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-200"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Télécharger le QR Code (PNG)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyLink}
                      className={`w-full h-12 font-medium text-base transition-colors ${copied ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {copied ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
                      {copied ? "Lien copié !" : "Copier le lien du menu"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => { 
                        resetAll(); 
                        if (authRole === 'admin') router.push('/admin'); 
                        else router.push('/intervenant'); 
                      }}
                      className="w-full h-12 font-medium text-base text-slate-600 hover:text-slate-900 hover:bg-slate-100 mt-2"
                    >
                      <LayoutDashboard className="mr-2 h-5 w-5" />
                      {authRole === 'admin' ? "Retour au Dashboard Admin" : "Terminer et créer une autre carte"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

        ) : (

            <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Studio QR Code</h1>
                <p className="text-slate-500">Personnalisez l'apparence du QR code que vos clients scanneront.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mb-8">
                <QRCodeStudio 
                  dataUrl="https://moncode.bj/c/"
                  
                  onChange={(configStr: string) => setQrStyle(configStr)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-medium mb-8">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 mb-8">
                <div className="max-w-md space-y-3">
                  <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-500" />
                    Nom du fichier à télécharger (Optionnel)
                  </Label>
                  <p className="text-xs text-slate-500">Donnez un nom personnalisé au fichier QR code pour le retrouver plus facilement.</p>
                  <Input 
                    placeholder="Ex: qr-code-terrasse" 
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    className="h-11 max-w-sm bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating} 
                  className="h-14 px-8 bg-blue-500 hover:bg-blue-700 text-white text-base font-semibold shadow-xl shadow-slate-200 rounded-xl transition-all"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-white animate-spin mr-3" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      Générer la carte finale
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

        )}
      </section>
    </main>
  );
}
