"use client";

import React, { useState } from "react";
import { MapPin, MessageCircle, Clock, Image as ImageIcon, Info, ChevronDown, ChevronUp, Share2 } from "lucide-react";

interface ScheduleDay {
  isOpen: boolean;
  open: string;
  close: string;
}

interface RestaurantCardLayoutProps {
  restaurantName: string;
  logoUrl?: string;
  address?: string;
  locationUrl?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  snapchatUrl?: string;
  additionalInfo?: string;
  schedule?: Record<string, ScheduleDay>;
  menuImages: string[];
  placeImages?: string[];
  inPreview?: boolean;
  layout?: string;
}

export default function RestaurantCardLayout({
  restaurantName,
  logoUrl,
  address,
  locationUrl,
  phoneNumber,
  menuImages,
  placeImages = [],
  facebookUrl,
  instagramUrl,
  xUrl,
  snapchatUrl,
  additionalInfo,
  schedule,
  inPreview = false,
  layout = "classic"
}: RestaurantCardLayoutProps) {
  
  const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber.replace(/\D/g, '')}` : "";
  const displayTitle = restaurantName || "Nom du Restaurant";
  
  const [showMinimalInfo, setShowMinimalInfo] = useState(false);

  // REUSABLE BLOCKS
  const SocialsBlock = () => {
    if (!facebookUrl && !instagramUrl && !xUrl && !snapchatUrl) return null;
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        {facebookUrl && (
          <a href={inPreview ? "#" : facebookUrl} target={inPreview ? undefined : "_blank"} className="w-8 h-8 rounded-full flex items-center justify-center border hover:scale-105 transition-transform font-bold text-[10px]" style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-card-bg)" }}>FB</a>
        )}
        {instagramUrl && (
          <a href={inPreview ? "#" : instagramUrl} target={inPreview ? undefined : "_blank"} className="w-8 h-8 rounded-full flex items-center justify-center border hover:scale-105 transition-transform font-bold text-[10px]" style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-card-bg)" }}>IG</a>
        )}
        {xUrl && (
          <a href={inPreview ? "#" : xUrl} target={inPreview ? undefined : "_blank"} className="w-8 h-8 rounded-full flex items-center justify-center border hover:scale-105 transition-transform font-bold text-[10px]" style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-card-bg)" }}>X</a>
        )}
        {snapchatUrl && (
          <a href={inPreview ? "#" : snapchatUrl} target={inPreview ? undefined : "_blank"} className="w-8 h-8 rounded-full flex items-center justify-center border hover:scale-105 transition-transform font-bold text-[10px]" style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-card-bg)" }}>SC</a>
        )}
      </div>
    );
  };

  const ScheduleBlock = () => {
    if (!schedule) return null;
    return (
      <div className="flex flex-col gap-1 opacity-80 text-xs mt-1 w-full">
        {Object.entries({
          "Lundi": schedule.monday,
          "Mardi": schedule.tuesday,
          "Mercredi": schedule.wednesday,
          "Jeudi": schedule.thursday,
          "Vendredi": schedule.friday,
          "Samedi": schedule.saturday,
          "Dimanche": schedule.sunday
        }).map(([day, hrs]) => (
          <div key={day} className="flex justify-between w-full">
            <span className="w-20 font-medium">{day}</span>
            <span>{hrs?.isOpen ? `${hrs.open} - ${hrs.close}` : "Fermé"}</span>
          </div>
        ))}
      </div>
    );
  };

  const MenuCarousel = ({ horizontal = true, masonry = false }: { horizontal?: boolean, masonry?: boolean }) => (
    <div 
      className={`flex ${horizontal ? 'overflow-x-auto gap-3 px-4 pb-4 snap-x snap-mandatory' : masonry ? 'flex-col gap-4 px-4 pb-4' : 'flex-col gap-4 px-4 pb-4'}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {menuImages && menuImages.length > 0 ? (
        menuImages.map((img, i) => (
          <div 
            key={i} 
            className={`${horizontal ? 'shrink-0 snap-center w-[65vw] sm:w-[240px] max-w-[240px]' : 'w-full'} ${masonry ? 'rounded-2xl' : 'aspect-[3/4] rounded-2xl'} overflow-hidden border shadow-sm relative`}
            style={masonry ? {} : { backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
          >
            <img src={img} alt={`Menu ${i + 1}`} className={`${masonry ? 'w-full h-auto object-contain' : 'w-full h-full object-cover'}`} />
          </div>
        ))
      ) : (
        [1, 2].map((i) => (
          <div 
            key={i} 
            className={`${horizontal ? 'shrink-0 snap-center w-[65vw] sm:w-[240px] max-w-[240px]' : 'w-full'} aspect-[3/4] rounded-2xl overflow-hidden border flex flex-col items-center justify-center opacity-60`}
            style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
          >
            <span className="text-3xl mb-2">🍽️</span>
            <span className="text-xs font-semibold">Page ${i}</span>
          </div>
        ))
      )}
    </div>
  );

  const PlaceCarousel = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    if (!placeImages || placeImages.length === 0) return null;
    return (
      <div className={`flex overflow-x-auto ${fullWidth ? 'gap-0 snap-x snap-mandatory w-full' : 'gap-2 px-4 pb-4 snap-x snap-mandatory'}`} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {placeImages.map((img, i) => (
          <div key={i} className={`shrink-0 snap-center ${fullWidth ? 'w-full h-48 sm:h-56' : 'w-[50vw] max-w-[200px] aspect-video rounded-xl border'} overflow-hidden relative`} style={!fullWidth ? { borderColor: "var(--theme-border)" } : {}}>
            <img src={img} alt={`Lieu ${i + 1}`} className="w-full h-full object-cover" />
            {fullWidth && placeImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                {i + 1} / {placeImages.length}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  // ----------------------------------------------------
  // LAYOUT: CLASSIC
  // ----------------------------------------------------
  if (layout === "classic") {
    return (
      <div className="w-full min-h-full flex flex-col font-sans transition-colors duration-300" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
        <div className="p-4 flex justify-between items-start">
          <div className="flex flex-col gap-2 max-w-[75%]">
            <div className="w-16 h-16 rounded-xl overflow-hidden border shadow-sm flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black opacity-30">{displayTitle.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight tracking-tight break-words">{displayTitle}</h1>
              {address && <p className="mt-1 text-xs opacity-80 leading-snug break-words">{address}</p>}
            </div>
          </div>
          {locationUrl && (
            <a href={inPreview ? "#" : locationUrl} target={inPreview ? undefined : "_blank"} rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-transform hover:scale-105 shrink-0" style={{ backgroundColor: "var(--theme-card-bg)", color: "var(--theme-accent)", borderColor: "var(--theme-border)" }} onClick={(e) => inPreview && e.preventDefault()}>
              <MapPin size={18} strokeWidth={2.5} />
            </a>
          )}
        </div>

        <div className="px-4 mt-1 flex flex-col gap-3">
          <div className="flex justify-start"><SocialsBlock /></div>
          {additionalInfo && (
            <div className="text-xs p-3 rounded-xl border" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
              <div className="flex items-center gap-1.5 mb-1.5 font-semibold"><Info size={14} /> À savoir</div>
              <div className="opacity-80 whitespace-pre-wrap leading-relaxed">{additionalInfo}</div>
            </div>
          )}
          {schedule && (
            <div className="text-xs p-3 rounded-xl border" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
              <div className="flex items-center gap-1.5 mb-2 font-semibold"><Clock size={14} /> Horaires d'ouverture</div>
              <ScheduleBlock />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col mt-6">
          <div className="px-4 flex items-center gap-2 mb-3">
            <h2 className="text-base font-bold opacity-90">Le Menu</h2>
            <div className="h-[2px] flex-1 rounded-full opacity-50" style={{ backgroundColor: "var(--theme-border)" }}></div>
          </div>
          <MenuCarousel horizontal={true} />
          
          {placeImages && placeImages.length > 0 && (
            <div className="mt-2">
              <div className="px-4 flex items-center gap-2 mb-3">
                <h2 className="text-base font-bold opacity-90">Notre Lieu</h2>
              </div>
              <PlaceCarousel fullWidth={false} />
            </div>
          )}
        </div>

        <div className="p-4 mt-auto pb-6">
          <a href={inPreview ? "#" : whatsappUrl} target={inPreview ? undefined : "_blank"} rel="noopener noreferrer" className="w-full rounded-xl border-none text-white shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]" style={{ backgroundColor: "#25d366", minHeight: "48px", textDecoration: "none" }} onClick={(e) => inPreview && e.preventDefault()}>
            <MessageCircle size={20} />
            <span className="text-sm font-bold">Contactez nous</span>
          </a>
        </div>
      </div>
    );
  }


  // ----------------------------------------------------
  // LAYOUT: MAPS (Google Maps Style)
  // ----------------------------------------------------
  if (layout === "maps") {
    return (
      <div className="w-full min-h-full flex flex-col font-sans transition-colors duration-300 pb-6" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
        {/* Cover full width carousel */}
        <div className="w-full relative bg-slate-200">
          {(placeImages && placeImages.length > 0) ? (
            <PlaceCarousel fullWidth={true} />
          ) : (menuImages && menuImages.length > 0) ? (
            <div className="w-full h-48 sm:h-56"><img src={menuImages[0]} alt="Cover" className="w-full h-full object-cover" /></div>
          ) : (
            <div className="w-full h-48 flex items-center justify-center opacity-30 text-4xl">📸</div>
          )}
          
          {logoUrl && (
            <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-[3px] shadow-sm overflow-hidden bg-white z-10" style={{ borderColor: "var(--theme-bg)" }}>
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Header Info */}
        <div className="px-4 pt-8 pb-3">
          <h1 className="text-xl font-bold leading-tight">{displayTitle}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-green-600 font-bold text-xs">Ouvert</span>
            <span className="text-slate-500 text-xs flex items-center gap-1">• Restaurant</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex overflow-x-auto gap-3 px-4 pb-4 border-b" style={{ borderColor: "var(--theme-border)", scrollbarWidth: "none" }}>
          {locationUrl && (
            <a href={inPreview ? "#" : locationUrl} target={inPreview ? undefined : "_blank"} className="flex flex-col items-center gap-1 shrink-0 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-sm transition-colors">
                <MapPin size={16} />
              </div>
              <span className="text-[10px] font-medium text-blue-600">Itinéraire</span>
            </a>
          )}
          {phoneNumber && (
            <a href={inPreview ? "#" : whatsappUrl} target={inPreview ? undefined : "_blank"} className="flex flex-col items-center gap-1 shrink-0 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white shadow-sm transition-colors">
                <MessageCircle size={16} />
              </div>
              <span className="text-[10px] font-medium text-green-600">WhatsApp</span>
            </a>
          )}
          {facebookUrl && (
            <a href={inPreview ? "#" : facebookUrl} target={inPreview ? undefined : "_blank"} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border text-xs font-bold" style={{ borderColor: "var(--theme-border)" }}>FB</div>
              <span className="text-[10px] font-medium opacity-80">Facebook</span>
            </a>
          )}
          {instagramUrl && (
            <a href={inPreview ? "#" : instagramUrl} target={inPreview ? undefined : "_blank"} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border text-xs font-bold" style={{ borderColor: "var(--theme-border)" }}>IG</div>
              <span className="text-[10px] font-medium opacity-80">Instagram</span>
            </a>
          )}
        </div>

        {/* Overview Info */}
        <div className="px-4 py-4 flex flex-col gap-4 border-b text-sm" style={{ borderColor: "var(--theme-border)" }}>
          {address && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="opacity-70 mt-0.5 shrink-0" />
              <span className="leading-snug text-xs">{address}</span>
            </div>
          )}
          {schedule && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="opacity-70 shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-xs mb-1">Horaires</div>
                <ScheduleBlock />
              </div>
            </div>
          )}
          {additionalInfo && (
            <div className="flex items-start gap-3">
              <Info size={18} className="opacity-70 mt-0.5 shrink-0" />
              <span className="leading-relaxed opacity-90 text-xs whitespace-pre-wrap">{additionalInfo}</span>
            </div>
          )}
        </div>

        {/* Menu Feed */}
        <div className="pt-4 bg-black/5" style={{ backgroundColor: "var(--theme-card-bg)" }}>
          <div className="px-4 mb-3">
            <h2 className="text-base font-bold">Le Menu</h2>
          </div>
          <MenuCarousel horizontal={false} masonry={true} />
        </div>
      </div>
    );
  }


  // ----------------------------------------------------
  // LAYOUT: MINIMAL
  // ----------------------------------------------------
  if (layout === "minimal") {
    return (
      <div className="w-full min-h-full flex flex-col font-sans transition-colors duration-300" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
        <div className="p-4 text-center flex flex-col items-center border-b" style={{ borderColor: "var(--theme-border)" }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover mb-3 shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-full mb-3 shadow-sm flex items-center justify-center border font-bold text-xl" style={{ borderColor: "var(--theme-border)" }}>
              {displayTitle.charAt(0)}
            </div>
          )}
          <h1 className="text-lg font-bold tracking-widest uppercase mb-1">{displayTitle}</h1>
          <p className="text-[10px] opacity-60 tracking-wider uppercase mb-3">Menu Digital</p>
          
          <div className="flex gap-3 text-xs mb-1">
            {locationUrl && <a href={inPreview ? "#" : locationUrl} className="underline opacity-80 font-medium">Itinéraire</a>}
            {phoneNumber && <a href={inPreview ? "#" : whatsappUrl} className="underline opacity-80 font-medium">WhatsApp</a>}
          </div>
        </div>

        <div className="flex-1 py-4">
          <MenuCarousel horizontal={false} masonry={true} />
        </div>

        {/* Minimal Info Toggle */}
        <div className="mt-auto border-t p-4" style={{ borderColor: "var(--theme-border)" }}>
          <button 
            onClick={() => setShowMinimalInfo(!showMinimalInfo)} 
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80 py-2"
          >
            Infos Pratiques
            {showMinimalInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showMinimalInfo && (
            <div className="pt-4 flex flex-col gap-4 text-xs animate-in slide-in-from-bottom-2">
              {address && <div className="opacity-80 text-center">{address}</div>}
              {schedule && (
                <div className="bg-black/5 p-3 rounded-xl" style={{ backgroundColor: "var(--theme-card-bg)" }}>
                  <ScheduleBlock />
                </div>
              )}
              {additionalInfo && <div className="opacity-80 text-center whitespace-pre-wrap">{additionalInfo}</div>}
              <div className="flex justify-center mt-2"><SocialsBlock /></div>
              {placeImages && placeImages.length > 0 && (
                <div className="mt-2"><PlaceCarousel fullWidth={true} /></div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }


  // ----------------------------------------------------
  // LAYOUT: PREMIUM (Avant-Garde / Sophistiqué)
  // ----------------------------------------------------
  if (layout === "premium") {
    const bgImage = (placeImages && placeImages.length > 0) ? placeImages[0] : (menuImages && menuImages.length > 0 ? menuImages[0] : logoUrl);
    
    return (
      <div className="w-full min-h-full flex flex-col font-sans relative overflow-hidden bg-slate-950 text-slate-50">
        {/* Blurry Background */}
        {bgImage && (
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[40px] z-10" />
            <img src={bgImage} alt="bg" className="w-full h-full object-cover opacity-30" />
          </div>
        )}
        
        <div className="relative z-10 p-5 flex flex-col items-center pt-10">
          <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-xl mb-4 ring-2 ring-white/10">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl">{displayTitle.charAt(0)}</div>}
          </div>
          
          <h1 className="text-2xl font-serif italic mb-2 text-center text-white drop-shadow-md">{displayTitle}</h1>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {locationUrl && (
              <a href={inPreview ? "#" : locationUrl} className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-xs transition-colors">
                Itinéraire
              </a>
            )}
            {phoneNumber && (
              <a href={inPreview ? "#" : whatsappUrl} className="px-4 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-lg transition-colors">
                Contacter
              </a>
            )}
          </div>
        </div>

        {/* Main Content Area - Glassmorphism */}
        <div className="relative z-10 mt-6 bg-slate-900/40 backdrop-blur-xl rounded-t-[2rem] flex-1 border-t border-white/10 pt-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col">
          
          <div className="px-4 text-center">
            <h2 className="text-white/50 tracking-[0.2em] uppercase text-[10px] font-bold mb-4">À La Carte</h2>
            <div className="flex flex-col gap-4">
              {menuImages && menuImages.length > 0 ? (
                menuImages.map((img, i) => (
                  <img key={i} src={img} alt="Menu" className="w-full rounded-xl shadow-lg ring-1 ring-white/10 object-contain" />
                ))
              ) : (
                <div className="w-full aspect-[3/4] bg-white/5 rounded-xl flex items-center justify-center text-white/30 border border-white/5 text-xs">
                  Aucun menu
                </div>
              )}
            </div>
          </div>
          
          {/* Information Section in Premium */}
          <div className="mt-8 pt-6 border-t border-white/10 px-5 pb-8 bg-slate-950/30 backdrop-blur-md">
            <h2 className="text-white/50 tracking-[0.2em] uppercase text-[10px] font-bold mb-4 text-center">Informations</h2>
            
            <div className="flex flex-col gap-4 text-xs opacity-90 text-white/80">
              {address && <div className="text-center">{address}</div>}
              {additionalInfo && <div className="text-center italic text-[11px] opacity-70 whitespace-pre-wrap">{additionalInfo}</div>}
              
              {schedule && (
                <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex flex-col gap-1 w-full text-[10px]">
                    {Object.entries({
                      "Lundi": schedule.monday,
                      "Mardi": schedule.tuesday,
                      "Mercredi": schedule.wednesday,
                      "Jeudi": schedule.thursday,
                      "Vendredi": schedule.friday,
                      "Samedi": schedule.saturday,
                      "Dimanche": schedule.sunday
                    }).map(([day, hrs]) => (
                      <div key={day} className="flex justify-between w-full">
                        <span className="font-medium text-white/60">{day}</span>
                        <span>{hrs?.isOpen ? `${hrs.open} - ${hrs.close}` : "Fermé"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <div className="flex gap-2">
                  {facebookUrl && <a href={inPreview ? "#" : facebookUrl} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold">FB</a>}
                  {instagramUrl && <a href={inPreview ? "#" : instagramUrl} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold">IG</a>}
                  {xUrl && <a href={inPreview ? "#" : xUrl} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold">X</a>}
                  {snapchatUrl && <a href={inPreview ? "#" : snapchatUrl} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold">SC</a>}
                </div>
              </div>

              {placeImages && placeImages.length > 0 && (
                <div className="mt-4">
                  <div className="flex overflow-x-auto gap-2 pb-2 snap-x" style={{ scrollbarWidth: "none" }}>
                    {placeImages.map((img, i) => (
                      <div key={i} className="shrink-0 snap-center w-32 aspect-video rounded-lg overflow-hidden border border-white/10">
                        <img src={img} alt={`Lieu ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Format inconnu</div>;
}
