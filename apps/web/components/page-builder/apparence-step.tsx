"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/logo";
import { useFile } from "@/app/context/FileContext";
import RestaurantCardLayout from "@/components/RestaurantCardLayout";
import { ArrowLeft, ArrowRight, Palette, Smartphone, Check, LayoutTemplate, Map, Minimize, Diamond, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUILDER_FLOWS, type BuilderMode } from "@/lib/builder-flows";


const LAYOUT_OPTIONS = [
  { id: "classic", name: "Classique", icon: <LayoutTemplate size={20} />, desc: "La structure standard" },
  { id: "maps", name: "Style Maps", icon: <Map size={20} />, desc: "Focus visuel et actions" },
  { id: "minimal", name: "Minimaliste", icon: <Minimize size={20} />, desc: "Le menu avant tout" },
  { id: "premium", name: "Avant-Garde", icon: <Diamond size={20} />, desc: "Design sophistiqué" },
  { id: "exoticas", name: "Exoticas", icon: <Leaf size={20} />, desc: "Éditorial, vert et crème" }
];

const THEMES = [
  { id: "theme-1", name: "Gastronomique", subtitle: "Dark Luxury", desc: "Noir profond et touches or champagne.", bgPreview: "#0d0b09", accentColor: "#d4af37", textColor: "#fdf8e2" },
  { id: "theme-2", name: "Bistrot", subtitle: "Terracotta & Bois", desc: "Ambiance chaleureuse et conviviale.", bgPreview: "#fcf8f2", accentColor: "#c85a32", textColor: "#321d14" },
  { id: "theme-3", name: "Moderne", subtitle: "Minimaliste", desc: "Design épuré, blanc et teintes sable.", bgPreview: "#ffffff", accentColor: "#827a72", textColor: "#2d2a28" },
  { id: "theme-4", name: "Végétal", subtitle: "Botanique", desc: "Vert émeraude profond et tons nature.", bgPreview: "#f2f7f4", accentColor: "#2c5f43", textColor: "#193626" },
  { id: "theme-5", name: "Vibrant", subtitle: "Street Food", desc: "Foncé avec des touches oranges fluo.", bgPreview: "#13100e", accentColor: "#ef6a22", textColor: "#fff5ec" },
  { id: "theme-6", name: "Cyber", subtitle: "Néon & Futur", desc: "Noir total avec des accents cyan brillants.", bgPreview: "#000000", accentColor: "#00ffcc", textColor: "#ffffff" },
  { id: "theme-7", name: "Océan", subtitle: "Fraîcheur Marine", desc: "Bleus apaisants et fond azur clair.", bgPreview: "#f0f8ff", accentColor: "#0066cc", textColor: "#003366" },
  { id: "theme-8", name: "Élégance", subtitle: "Rose Poudré", desc: "Tons doux, rose pâle et accents cuivrés.", bgPreview: "#fff5f5", accentColor: "#d4a373", textColor: "#4a3030" },
  { id: "theme-9", name: "Torréfié", subtitle: "Chaud & Corsé", desc: "Nuances de café intense et jaune ambré.", bgPreview: "#3e2723", accentColor: "#ffb300", textColor: "#efebe9" },
  { id: "theme-10", name: "Crépuscule", subtitle: "Mystique", desc: "Fond violet sombre et accents lilas.", bgPreview: "#282a36", accentColor: "#bd93f9", textColor: "#f8f8f2" },
  { id: "theme-exoticas", name: "Exoticas", subtitle: "Vert forêt & Crème", desc: "Éditorial et chaleureux, inspiré d'Exoticas.", bgPreview: "#f7f6f1", accentColor: "#466931", textColor: "#22331b" },
];

export default function ApparenceStep({ mode }: { mode: BuilderMode }) {
  const router = useRouter();
  const flow = BUILDER_FLOWS[mode];
  const { restaurantInfo, customization, setThemeId, setCardLayout, authToken, authRole, isAuthLoading } = useFile();
  const allowed = !flow.requiresAdmin || (Boolean(authToken) && authRole === "admin");

  useEffect(() => {
    if (!isAuthLoading && !allowed) router.push(flow.loginHref);
  }, [allowed, isAuthLoading, router, flow.loginHref]);

  // Accès direct sans étape 1 : on renvoie remplir les informations.
  useEffect(() => {
    if (!restaurantInfo.restaurantName.trim()) router.replace(flow.apparence.back);
  }, [restaurantInfo.restaurantName, router, flow.apparence.back]);

  if (flow.requiresAdmin && (isAuthLoading || !allowed)) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sage text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-line border-t-blue-600 animate-spin" />
          <span>Chargement...</span>
        </div>
      </main>
    );
  }

  const previewLogo = restaurantInfo.logoFile ? URL.createObjectURL(restaurantInfo.logoFile) : undefined;
  const previewPlaces = restaurantInfo.placeFiles.length > 0 ? restaurantInfo.placeFiles.map(f => URL.createObjectURL(f)) : [];
  const previewMenus = restaurantInfo.menuFiles.length > 0 
    ? restaurantInfo.menuFiles.map(f => URL.createObjectURL(f))
    : [];

  const themeClass = `restaurant-${customization.themeId}`;

  return (
    <main className="min-h-screen flex flex-col font-sans">
      {/* HEADER */}
      <header className="brand-surface w-full h-16 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30 shadow-[0_8px_30px_rgba(15,42,107,0.25)]">
        <Link href="/" aria-label="Moncode — accueil">
          <Logo variant="light" />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(flow.apparence.back)} className="h-9 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button size="sm" onClick={() => router.push(flow.apparence.next)} className="h-9 gap-2 bg-white text-forest hover:bg-white/90 shadow-none">
            {flow.apparence.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto lg:overflow-hidden">
        
        {/* LEFT COLUMN: Controls */}
        <div className="w-full lg:w-[55%] xl:w-[60%] flex flex-col p-5 lg:p-8 lg:overflow-y-auto lg:max-h-[calc(100vh-64px)]">
          <div className="mb-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-6 h-px bg-blue-600" />
              {flow.apparence.step}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-ink/90 mb-4 flex items-center gap-3">
              <Palette className="h-8 w-8 text-blue-600" />
              Personnalisation
            </h1>
            <p className="text-sage text-base leading-relaxed">
              Choisissez le thème visuel qui correspond le mieux à l&apos;identité de votre établissement. Le rendu final s&apos;affiche en temps réel sur l&apos;écran à droite.
            </p>
          </div>

          
          {/* LAYOUT SECTION */}
          <div className="mb-8 max-w-3xl">
            <h2 className="text-xl font-bold text-ink/90 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
              Disposition de la carte
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LAYOUT_OPTIONS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setCardLayout && setCardLayout(layout.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 aspect-square rounded-xl border-2 transition-all text-center ${
                    customization.cardLayout === layout.id 
                      ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-100 scale-[1.02]' 
                      : 'surface hover:border-forest/40'
                  }`}
                >
                  <div className={`p-2.5 rounded-full ${customization.cardLayout === layout.id ? "bg-blue-600 text-white shadow-sm" : "bg-white/50 text-sage"}`}>
                    {layout.icon}
                  </div>
                  <div className={`font-bold text-xs leading-tight ${customization.cardLayout === layout.id ? 'text-blue-700' : 'text-ink/80'}`}>
                    {layout.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-ink/90 mb-4 flex items-center gap-2 mt-8">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
            Thème Visuel (Couleurs)
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-w-3xl pb-10">
            {THEMES.map((theme) => {
              const isSelected = customization.themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setThemeId(theme.id)}
                  className={`group cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-col items-center justify-center aspect-square relative ${
                    isSelected 
                      ? 'border-blue-600 shadow-md shadow-blue-100/50 scale-[1.05] z-10' 
                      : 'border-line hover:border-forest/40 hover:shadow-sm hover:scale-[1.02]'
                  }`}
                  style={{ backgroundColor: theme.bgPreview }}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-blue-600 rounded-full p-0.5 shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* Color preview circle */}
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm mb-2 border border-black/5" 
                    style={{ backgroundColor: theme.accentColor }} 
                  />
                  
                  {/* Theme Name */}
                  <span 
                    className="text-[10px] sm:text-xs font-bold text-center px-1 truncate w-full"
                    style={{ color: theme.textColor }}
                  >
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Mobile Preview */}
        <div className="w-full lg:w-[45%] xl:w-[40%] bg-white/50 lg:border-l border-line flex flex-col items-center justify-center p-8 lg:p-12 min-h-[600px] lg:min-h-0 relative">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-line text-sm font-semibold text-ink/80 shadow-sm mb-8 z-10">
            <Smartphone className="h-4 w-4 text-blue-600" />
            Aperçu en direct
          </div>

          {/* iPhone Mockup */}
          <div className="relative mx-auto w-[280px] h-[580px] sm:w-[320px] sm:h-[650px] bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border-[8px] border-[#1a1a1a] ring-1 ring-ink/10 overflow-hidden transform transition-transform hover:scale-[1.02] duration-500">
            
            {/* iPhone Notch */}
            <div className="absolute top-0 inset-x-0 w-32 h-6 bg-[#1a1a1a] rounded-b-3xl mx-auto z-30 flex items-center justify-center gap-2">
              {/* Speaker / Camera details inside notch */}
              <div className="w-10 h-1.5 bg-[#0a0a0a] rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-[#080808] rounded-full ring-1 ring-white/10"></div>
            </div>

            {/* Screen Content */}
            <div className={`w-full h-full rounded-[2rem] overflow-y-auto overflow-x-hidden relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${themeClass}`} style={{ backgroundColor: "var(--theme-bg)" }}>
              <RestaurantCardLayout 
                restaurantName={restaurantInfo.restaurantName || "Mon Restaurant"}
                address={restaurantInfo.address}
                logoUrl={previewLogo}
                locationUrl={restaurantInfo.locationUrl}
                phoneNumber={restaurantInfo.phoneNumber}
                facebookUrl={restaurantInfo.facebookUrl}
                instagramUrl={restaurantInfo.instagramUrl}
                xUrl={restaurantInfo.xUrl}
                snapchatUrl={restaurantInfo.snapchatUrl}
                additionalInfo={restaurantInfo.additionalInfo}
                schedule={restaurantInfo.schedule}
                menuImages={previewMenus}
                placeImages={previewPlaces}
                inPreview={true}
                layout={customization.cardLayout}
              />
            </div>
            
            {/* Screen Glare Effect */}
          </div>
        </div>

      </div>
    </main>
  );
}
