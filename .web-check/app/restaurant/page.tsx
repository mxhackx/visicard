"use client";

import { useState, ChangeEvent, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  LogOut, 
  Store, 
  Phone, 
  MapPin, 
  Image as ImageIcon, 
  UploadCloud,
  

  

  

  

  Clock,
  Camera,

  MessageCircle,
  SwitchCamera,
 
  AlertCircle,
  X,
  FileImage,
  LocateFixed
} from "lucide-react";
import { useFile } from "../context/FileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRY_CODES = [
  { code: "+229", label: "🇧🇯 +229" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+225", label: "🇨🇮 +225" },
  { code: "+221", label: "🇸🇳 +221" },
  { code: "+228", label: "🇹🇬 +228" },
  { code: "+237", label: "🇨🇲 +237" },
  { code: "+243", label: "🇨🇩 +243" },
  { code: "+241", label: "🇬🇦 +241" },
  { code: "+226", label: "🇧🇫 +226" },
  { code: "+1", label: "🇺🇸/🇨🇦 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+41", label: "🇨🇭 +41" },
];

export default function RestaurantPage() {
  const router = useRouter();
  const {
    restaurantInfo,
    setRestaurantInfo,
    setRestaurantLogo,
    addMenuFiles,
    removeMenuFile,
    addPlaceFiles,
    removePlaceFile,
    authToken,
    isAuthLoading,
    logoutSession,
  } = useFile();

  useEffect(() => {
    if (!isAuthLoading && !authToken) {
      router.push("/connexion");
    }
  }, [authToken, isAuthLoading, router]);

  const [formError, setFormError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);
  const placeInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [countryCode, setCountryCode] = useState("+229");
  const [localNumber, setLocalNumber] = useState("");
  const phoneInitialized = useRef(false);

  useEffect(() => {
    if (!phoneInitialized.current) {
      const phone = restaurantInfo.phoneNumber || "";
      if (phone) {
        const matched = COUNTRY_CODES.find(c => phone.startsWith(c.code));
        if (matched) {
          setCountryCode(matched.code);
          setLocalNumber(phone.slice(matched.code.length).trim());
        } else {
          setLocalNumber(phone);
        }
      }
      phoneInitialized.current = true;
    }
  }, [restaurantInfo.phoneNumber]);

  const [isLocating, setIsLocating] = useState(false);

  const handleTextChange = (field: "restaurantName" | "locationUrl" | "phoneNumber" | "address" | "facebookUrl" | "instagramUrl" | "xUrl" | "snapchatUrl" | "additionalInfo", val: string) => {
    setRestaurantInfo((prev) => ({ ...prev, [field]: val }));
    if (formError) setFormError(null);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handleTextChange("locationUrl", `https://maps.google.com/?q=${lat},${lng}`);
      },
      (error) => {
        setIsLocating(false);
        alert("Impossible de récupérer la position. Veuillez vérifier vos permissions.");
      }
    );
  };

  const handlePhoneChange = (code: string, num: string) => {
    const cleanNum = num.replace(/\s+/g, "");
    handleTextChange("phoneNumber", `${code}${cleanNum}`);
  };

  const onCodeChange = (code: string | null) => {
    if (!code) return;
    setCountryCode(code);
    handlePhoneChange(code, localNumber);
  };

  const onNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value;
    setLocalNumber(num);
    handlePhoneChange(countryCode, num);
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestaurantLogo(file);
    }
    e.target.value = "";
  };

  const handleMenuChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addMenuFiles(Array.from(files));
    }
    e.target.value = "";
  };

  const handleScheduleChange = (day: string, field: "isOpen" | "open" | "close", val: boolean | string) => {
    setRestaurantInfo((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: val
        }
      }
    }));
  };

  const handlePlaceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addPlaceFiles(Array.from(files));
    }
    e.target.value = "";
  };

  const handleLogout = () => {
    logoutSession();
    router.push("/connexion");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!restaurantInfo.restaurantName.trim()) {
      setFormError("Veuillez renseigner le nom du restaurant.");
      return;
    }

    if (!localNumber.trim()) {
      setFormError("Veuillez renseigner le numéro WhatsApp du restaurant.");
      return;
    }

    const trimmedLocation = restaurantInfo.locationUrl.trim();
    if (!trimmedLocation) {
      setFormError("Veuillez définir l'emplacement sur la carte.");
      return;
    }

    if (restaurantInfo.menuFiles.length === 0 && !restaurantInfo.logoFile) {
      setFormError("Veuillez charger au moins une photo du menu ou le logo du restaurant.");
      return;
    }

    setFormError(null);
    router.push("/personnalisation");
  };

  if (!mounted || isAuthLoading || !authToken) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col relative font-sans text-slate-900">
      {/* HEADER */}
      <header className="w-full h-16 border-b bg-white flex items-center justify-between px-6 lg:px-12 sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5 text-blue-600">
            <img src="/logo.svg" alt="MonCode Logo" className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">MonCode</span>
        </Link>

        <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </header>

      {/* CONTENT */}
      <section className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* TOP NAVIGATION */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/intervenant")} className="gap-2 text-slate-500 hover:text-slate-900 -ml-3">
            <ArrowLeft className="h-4 w-4" />
            Intervenant
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Étape 2 sur 3
          </div>
        </div>

        {/* INTRO */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-6 h-px bg-blue-600" />
            Configuration
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Fiche Restaurant <br />
            <span className="text-blue-600">& Menu digital.</span>
          </h1>
          <p className="text-slate-500 text-base max-w-xl leading-relaxed">
            Renseignez l'identité du restaurant, son contact WhatsApp et chargez les photos de sa carte.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="flex items-center mb-10">
          {[
            { number: "01", label: "Intervention", active: true, done: true },
            { number: "02", label: "Restaurant", active: true, done: false },
            { number: "03", label: "Carte", active: false, done: false },
          ].map((step, index) => (
            <div key={step.number} className={`flex items-center ${index < 2 ? "flex-1" : "flex-none"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.done ? "bg-blue-600 text-white shadow-md shadow-blue-200" : 
                  step.active ? "bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-50" : 
                  "bg-slate-100 text-slate-400"
                }`}>
                  {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.number}
                </div>
                <span className={`text-sm hidden sm:block ${step.active ? "font-semibold text-slate-900" : "font-medium text-slate-500"}`}>
                  {step.label}
                </span>
              </div>
              {index < 2 && (
                <div className="h-px flex-1 mx-4 sm:mx-6 relative bg-slate-200">
                  {step.done && <div className="absolute inset-y-0 left-0 bg-blue-600 w-full" />}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FORM CARD */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600">
              <Store className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Informations de l'établissement</CardTitle>
              <CardDescription>Fournissez les coordonnées qui apparaîtront sur le menu numérique.</CardDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-8">
              
              {/* INFOS DE BASE */}
              <div className="space-y-3">
                <Label htmlFor="resto-name" className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-blue-500" />
                  Nom du restaurant *
                </Label>
                <Input
                  id="resto-name"
                  type="text"
                  placeholder="Ex: Le Gourmet Parisien"
                  value={restaurantInfo.restaurantName}
                  onChange={(e) => handleTextChange("restaurantName", e.target.value)}
                  required
                  className="h-11 shadow-none text-base sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Numéro WhatsApp */}
                <div className="space-y-3">
                  <Label htmlFor="resto-phone" className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-blue-500" />
                    Numéro WhatsApp *
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select value={countryCode} onValueChange={onCodeChange}>
                      <SelectTrigger className="w-[110px] !h-11 shadow-none text-sm px-2">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-sm">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      id="resto-phone"
                      type="tel"
                      placeholder="01 57 48 20 21"
                      value={localNumber}
                      onChange={onNumberChange}
                      required
                      className="h-11 flex-1 shadow-none text-base sm:text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Choisissez l'indicatif puis saisissez le numéro.</p>
                </div>

                {/* Adresse Physique */}
                <div className="space-y-3">
                  <Label htmlFor="resto-address" className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Adresse physique *
                  </Label>
                  <Input
                    id="resto-address"
                    type="text"
                    placeholder="Ex: 12 Rue de la Paix, Paris"
                    value={restaurantInfo.address || ""}
                    onChange={(e) => handleTextChange("address", e.target.value)}
                    required
                    className="h-11 shadow-none text-base sm:text-sm"
                  />
                  <p className="text-[11px] text-slate-500">S'affichera directement sur le menu digital.</p>
                </div>
              </div>

              {/* Localisation (Full width) */}
              <div className="space-y-3">
                <Label htmlFor="resto-location" className="flex items-center gap-2 text-sm">
                  <LocateFixed className="h-4 w-4 text-blue-500" />
                  Localisation *
                </Label>
                
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="h-11 px-5 shrink-0 w-full sm:w-auto text-sm font-semibold bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                  >
                    {isLocating && (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-700 animate-spin mr-2" />
                    )}
                    Position GPS
                  </Button>
                  <Input
                    id="resto-location"
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    value={restaurantInfo.locationUrl}
                    onChange={(e) => handleTextChange("locationUrl", e.target.value)}
                    required
                    className="h-11 shadow-none text-base sm:text-sm flex-1"
                  />
                </div>
                <p className="text-[11px] text-slate-500">Permet au client d'ouvrir l'itinéraire vers le restaurant au clic.</p>
              </div>

              
              <div className="h-px bg-slate-100 my-8 w-full" />

              {/* RESEAUX SOCIAUX */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-4 w-4 text-blue-500 font-bold flex items-center justify-center">@</div> Réseaux Sociaux <span className="text-xs font-normal text-slate-400">(Optionnel)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Ajoutez les liens complets vers vos profils (ex: https://instagram.com/monresto).</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="url" placeholder="Lien Facebook" value={restaurantInfo.facebookUrl} onChange={(e) => handleTextChange("facebookUrl", e.target.value)} className="h-11 shadow-none text-sm" />
                  <Input type="url" placeholder="Lien Instagram" value={restaurantInfo.instagramUrl} onChange={(e) => handleTextChange("instagramUrl", e.target.value)} className="h-11 shadow-none text-sm" />
                  <Input type="url" placeholder="Lien X (Twitter)" value={restaurantInfo.xUrl} onChange={(e) => handleTextChange("xUrl", e.target.value)} className="h-11 shadow-none text-sm" />
                  <Input type="url" placeholder="Lien Snapchat" value={restaurantInfo.snapchatUrl} onChange={(e) => handleTextChange("snapchatUrl", e.target.value)} className="h-11 shadow-none text-sm" />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-8 w-full" />

              {/* HORAIRES D'OUVERTURE */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Horaires d'ouverture
                  </h3>
                  <p className="text-[11px] text-slate-500">Cochez les jours d'ouverture et définissez les heures.</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  {[
                    { id: "monday", label: "Lundi" },
                    { id: "tuesday", label: "Mardi" },
                    { id: "wednesday", label: "Mercredi" },
                    { id: "thursday", label: "Jeudi" },
                    { id: "friday", label: "Vendredi" },
                    { id: "saturday", label: "Samedi" },
                    { id: "sunday", label: "Dimanche" },
                  ].map((day) => {
                    const hrs = restaurantInfo.schedule[day.id];
                    return (
                      <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-slate-50 gap-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={hrs.isOpen} 
                            onChange={(e) => handleScheduleChange(day.id, "isOpen", e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-sm font-medium ${hrs.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>{day.label}</span>
                        </div>
                        {hrs.isOpen && (
                          <div className="flex items-center gap-2">
                            <Input type="time" value={hrs.open} onChange={(e) => handleScheduleChange(day.id, "open", e.target.value)} className="h-9 w-28 text-sm" />
                            <span className="text-slate-400 text-xs">à</span>
                            <Input type="time" value={hrs.close} onChange={(e) => handleScheduleChange(day.id, "close", e.target.value)} className="h-9 w-28 text-sm" />
                          </div>
                        )}
                        {!hrs.isOpen && (
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pr-4">Fermé</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-8 w-full" />

              {/* MEDIAS */}
              <div className="space-y-8">
                
                {/* LOGO */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    Logo de l'établissement
                  </Label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    accept="image/png,image/jpeg,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                  />
                  
                  {restaurantInfo.logoPreview ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={restaurantInfo.logoPreview}
                        alt="Aperçu logo"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {restaurantInfo.logoFile?.name ?? "Logo sélectionné"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Prêt pour le menu numérique</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRestaurantLogo(null)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900">Cliquez pour ajouter le logo</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG ou WEBP. Optionnel mais conseillé.</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* MENUS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <FileImage className="h-4 w-4 text-blue-500" />
                      Photos du menu *
                    </Label>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {restaurantInfo.menuFiles.length} photo{restaurantInfo.menuFiles.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={menuInputRef}
                    onChange={handleMenuChange}
                    accept="image/png,image/jpeg,.jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                  />

                  {restaurantInfo.menuPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {restaurantInfo.menuPreviews.map((preview, idx) => (
                        <div key={preview} className="relative aspect-[3/4] rounded-lg border border-slate-200 bg-slate-100 shadow-sm overflow-hidden group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`Menu ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeMenuFile(idx)}
                              className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md transform hover:scale-110 transition-transform"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => menuInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50 transition-colors font-medium text-sm"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {restaurantInfo.menuFiles.length > 0 ? "Ajouter d'autres photos de menu" : "Ajouter les photos du menu"}
                  </button>
                </div>

              </div>

              
                
              {/* INFOS SUPPLEMENTAIRES */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" /> Informations supplémentaires <span className="text-xs font-normal text-slate-400">(Optionnel)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Ajoutez des détails (Ex: accès handicapé, terrasse, paiement sans contact...).</p>
                </div>
                <Textarea
                  placeholder="Écrivez vos informations supplémentaires ici..."
                  value={restaurantInfo.additionalInfo || ""}
                  onChange={(e) => handleTextChange("additionalInfo", e.target.value)}
                  className="min-h-[100px] shadow-none resize-y text-base sm:text-sm"
                />
              </div>

              <div className="h-px bg-slate-100 my-8 w-full" />

                {/* PHOTOS DU LIEU */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-blue-500" />
                      Photos de l'établissement <span className="text-xs font-normal text-slate-400">(Optionnel)</span>
                    </Label>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {restaurantInfo.placeFiles.length} photo{restaurantInfo.placeFiles.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={placeInputRef}
                    onChange={handlePlaceChange}
                    accept="image/png,image/jpeg,.jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                  />

                  {restaurantInfo.placePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {restaurantInfo.placePreviews.map((preview, idx) => (
                        <div key={preview} className="relative aspect-[4/3] rounded-lg border border-slate-200 bg-slate-100 shadow-sm overflow-hidden group">
                          <img
                            src={preview}
                            alt={`Lieu ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removePlaceFile(idx)}
                              className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md transform hover:scale-110 transition-transform"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => placeInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50 transition-colors font-medium text-sm"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {restaurantInfo.placeFiles.length > 0 ? "Ajouter d'autres photos du lieu" : "Ajouter des photos du lieu"}
                  </button>
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
              <Button type="submit" size="lg" className="w-full h-12 text-[15px] font-semibold gap-2 bg-blue-600 hover:bg-blue-700 shadow-none">
                Valider et choisir le thème
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* BOTTOM NOTE */}
        <p className="text-center mt-6 text-slate-400 text-xs flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Les médias importés seront automatiquement optimisés pour le menu digital.
        </p>
      </section>
      
      {/* FOOTER */}
      <footer className="w-full border-t bg-white p-6 text-center mt-auto">
        <p className="text-slate-500 text-xs">
          Scannez et partagez en un instant · <span className="text-blue-600 font-semibold">MonCode</span>
        </p>
      </footer>
    </main>
  );
}
