"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/logo";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LogOut,
  UserRound,
  Building2,
  Wallet,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useFile, UserInfo } from "@/app/context/FileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminInterventionStep() {
  const router = useRouter();
  const {
    userInfo,
    setUserInfo,
    authToken,
    authRole,
    isAuthLoading,
    logoutSession,
  } = useFile();

  const [formError, setFormError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && (!authToken || authRole !== "admin")) {
      router.push("/admin/connexion");
    }
  }, [authToken, authRole, isAuthLoading, router]);

  const handleUserInfoChange = (
    field: keyof UserInfo,
    value: string
  ) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

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
      !userInfo.amountReceived.toString().trim()
    ) {
      setFormError(
        "Veuillez remplir tous les champs obligatoires avant de continuer."
      );
      return;
    }

    setFormError(null);
    router.push("/admin/nouveau/informations");
  };

  const handleLogout = () => {
    logoutSession();
    router.push("/admin/connexion");
  };

  if (!mounted || isAuthLoading || !authToken || authRole !== "admin") {
    return (
      <main className="min-h-screen flex items-center justify-center text-sage text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-line border-t-blue-600 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative font-sans text-ink/90">
      {/* HEADER */}
      <header className="brand-surface w-full h-16 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30 shadow-[0_8px_30px_rgba(15,42,107,0.25)]">
        <Link href="/" aria-label="Moncode — accueil">
          <Logo variant="light" />
        </Link>

        <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </header>

      {/* CONTENT */}
      <section className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* TOP NAVIGATION */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/nouveau")} className="gap-2 text-sage hover:text-ink/90 -ml-3">
            <ArrowLeft className="h-4 w-4" />
            Choix du parcours
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Étape 1 sur 4
          </div>
        </div>

        {/* INTRO */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-6 h-px bg-blue-600" />
            Fiche d'intervention
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-ink/90 mb-4">
            Fiche intervenant <br />
            <span className="text-blue-600">et client.</span>
          </h1>
          <p className="text-sage text-base max-w-xl leading-relaxed">
            Renseignez les informations de l'intervention avant de configurer la page de l’établissement.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="flex items-center mb-10">
          {[
            { number: "01", label: "Intervention", active: true },
            { number: "02", label: "Restaurant", active: false },
            { number: "03", label: "Carte", active: false },
          ].map((step, index) => (
            <div key={step.number} className={`flex items-center ${index < 2 ? "flex-1" : "flex-none"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.active ? "bg-blue-600 text-white shadow-md shadow-forest/30" : "bg-white/50 text-sage"
                }`}>
                  {step.active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.number}
                </div>
                <span className={`text-sm ${step.active ? "font-semibold text-ink/90" : "font-medium text-sage"}`}>
                  {step.label}
                </span>
              </div>
              {index < 2 && <div className="h-px bg-line flex-1 mx-4 sm:mx-6" />}
            </div>
          ))}
        </div>

        {/* FORM CARD */}
        <Card className="shadow-sm border-line overflow-hidden">
          <div className="p-6 border-b border-line bg-white flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Informations de l'intervention</CardTitle>
              <CardDescription>Tous les champs marqués d'un astérisque (*) sont obligatoires.</CardDescription>
            </div>
          </div>

          <form onSubmit={handleFormSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                {/* INTERVENANT */}
                <div className="space-y-3">
                  <Label htmlFor="user-name" className="flex items-center gap-2 text-sm">
                    <UserRound className="h-4 w-4 text-blue-500" />
                    Nom de l'intervenant *
                  </Label>
                  <Input
                    id="user-name"
                    type="text"
                    placeholder="Ex. Jean Dupont"
                    value={userInfo.userName}
                    onChange={(e) => handleUserInfoChange("userName", e.target.value)}
                    required
                    className="h-11 shadow-none"
                  />
                </div>

                {/* CLIENT */}
                <div className="space-y-3">
                  <Label htmlFor="client-name" className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    Nom complet du client *
                  </Label>
                  <Input
                    id="client-name"
                    type="text"
                    placeholder="Ex. Entreprise Alpha"
                    value={userInfo.clientName}
                    onChange={(e) => handleUserInfoChange("clientName", e.target.value)}
                    required
                    className="h-11 shadow-none"
                  />
                </div>
              </div>

              {/* AMOUNT & CURRENCY */}
              <div className="space-y-3">
                <Label htmlFor="amount-received" className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  Montant reçu *
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="amount-received"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex. 50000"
                    value={userInfo.amountReceived}
                    onChange={(e) => handleUserInfoChange("amountReceived", e.target.value)}
                    required
                    className="h-11 flex-1 shadow-none"
                  />
                  <Select
                    value={userInfo.currency || "fcfa"}
                    onValueChange={(value) => handleUserInfoChange("currency", value || "fcfa")}
                  >
                    <SelectTrigger className="w-[120px] h-11 shadow-none">
                      <SelectValue placeholder="Devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fcfa">FCFA</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* WORK */}
              <div className="space-y-3">
                <Label htmlFor="work-done" className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Travaux effectués *
                </Label>
                <Textarea
                  id="work-done"
                  placeholder="Ex. Conception du menu digital, configuration QR Code, impression du support..."
                  value={userInfo.workDone}
                  onChange={(e) => handleUserInfoChange("workDone", e.target.value)}
                  rows={4}
                  required
                  className="resize-y min-h-[120px] text-base sm:text-sm shadow-none"
                />
              </div>

              {/* ERROR */}
              {formError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
              <Button type="submit" size="lg" className="w-full h-12 text-[15px] font-semibold gap-2 bg-forest hover:bg-forest-dark shadow-none">
                Continuer vers le restaurant
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* BOTTOM NOTE */}
        <p className="text-center mt-6 text-sage text-xs flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Les informations seront utilisées pour générer le parcours sécurisé.
        </p>
      </section>
      
      {/* FOOTER */}
      <footer className="w-full border-t border-line bg-white p-6 text-center mt-auto">
        <p className="text-sage text-xs">
          Scannez et partagez en un instant · <span className="text-forest font-semibold">Moncode</span>
        </p>
      </footer>
    </main>
  );
}
