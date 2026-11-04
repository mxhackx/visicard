"use client";

import { useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface QRStyleConfig {
  dotsType: "rounded" | "dots" | "classy" | "classy-rounded" | "square" | "extra-rounded";
  cornersType: "dot" | "square" | "extra-rounded";
  color: string;
}

interface QRCodeStudioProps {
  dataUrl: string;
  initialConfig?: QRStyleConfig;
  onChange?: (configJson: string) => void;
}

const DEFAULT_CONFIG: QRStyleConfig = {
  dotsType: "rounded",
  cornersType: "extra-rounded",
  color: "#3b82f6", // Default blue-500
};

export default function QRCodeStudio({ dataUrl, initialConfig, onChange }: QRCodeStudioProps) {
  const [config, setConfig] = useState<QRStyleConfig>(initialConfig || DEFAULT_CONFIG);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    import("qr-code-styling").then((module) => {
      if (!isMounted) return;
      const QRCodeStylingClass = module.default;
      const qr = new QRCodeStylingClass({
        width: 250,
        height: 250,
        imageOptions: { crossOrigin: "anonymous", margin: 10 },
      });
      setQrCode(qr);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (qrCode && ref.current) {
      if (ref.current.innerHTML !== "") {
        ref.current.innerHTML = "";
      }
      qrCode.append(ref.current);
    }
  }, [qrCode, ref]);

  useEffect(() => {
    if (!qrCode) return;
    qrCode.update({
      data: dataUrl,
      dotsOptions: { color: config.color, type: config.dotsType },
      cornersSquareOptions: { color: config.color, type: config.cornersType },
    });
    
    if (onChange) {
      onChange(JSON.stringify(config));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCode, config, dataUrl]);

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8">
       {/* Preview Side */}
       <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
         <h4 className="text-sm font-semibold text-slate-900 mb-6">Aperçu du QR Code</h4>
         <div ref={ref} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100" />
       </div>

       {/* Controls Side */}
       <div className="flex-1 flex flex-col gap-6">
         <h4 className="text-sm font-semibold text-slate-900">Apparence visuelle</h4>
         
         <div className="space-y-2">
           <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Motif des points</Label>
           <Select 
             value={config.dotsType} 
             onValueChange={(val) => setConfig({...config, dotsType: val as QRStyleConfig["dotsType"]})}
           >
             <SelectTrigger className="w-full bg-white h-11">
               <SelectValue placeholder="Choisir un motif" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="square">Carrés classiques</SelectItem>
               <SelectItem value="rounded">Arrondis</SelectItem>
               <SelectItem value="dots">Points</SelectItem>
               <SelectItem value="classy">Élégant</SelectItem>
               <SelectItem value="classy-rounded">Élégant & Arrondi</SelectItem>
               <SelectItem value="extra-rounded">Extra Arrondi</SelectItem>
             </SelectContent>
           </Select>
         </div>

         <div className="space-y-2">
           <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Forme des coins</Label>
           <Select 
             value={config.cornersType} 
             onValueChange={(val) => setConfig({...config, cornersType: val as QRStyleConfig["cornersType"]})}
           >
             <SelectTrigger className="w-full bg-white h-11">
               <SelectValue placeholder="Choisir une forme" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="square">Carrés (Standard)</SelectItem>
               <SelectItem value="extra-rounded">Arrondis</SelectItem>
               <SelectItem value="dot">Ronds</SelectItem>
             </SelectContent>
           </Select>
         </div>

         <div className="space-y-2">
           <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Couleur principale</Label>
           <div className="flex items-center gap-3">
             <input 
               type="color" 
               value={config.color} 
               onChange={(e) => setConfig({...config, color: e.target.value})} 
               className="w-12 h-12 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
             />
             <Input 
               type="text" 
               value={config.color.toUpperCase()} 
               onChange={(e) => setConfig({...config, color: e.target.value})}
               className="h-11 w-32 font-mono text-sm uppercase bg-white"
             />
           </div>
         </div>
       </div>
    </div>
  );
}
