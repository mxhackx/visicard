"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";

const KEY = "moncode-intro";

/**
 * Petite animation à l'ouverture du site : le sigle apparaît, un trait le « scanne », puis le rideau s'efface.
 * Une fois par session de navigation, et à volonté avec « ?intro » dans l'adresse (un script du <head> la masque sinon),
 * ignorée avec « réduire les animations », et passable d'un clic. Sans JavaScript, le CSS la fait disparaître seul.
 */
export default function IntroAnimation() {
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* stockage indisponible : l'animation pourra se rejouer, sans conséquence */
    }
    const onKey = () => setSkipped(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (skipped) return null;
  return (
    <div id="intro" aria-hidden="true" onClick={() => setSkipped(true)}>
      <div className="intro-stage">
        <div className="intro-mark">
          <LogoMark variant="dark" className="h-24 w-24 rounded-[22px]" />
          <span className="intro-corner intro-tl" />
          <span className="intro-corner intro-tr" />
          <span className="intro-corner intro-bl" />
          <span className="intro-corner intro-br" />
          <span className="intro-scan" />
        </div>
        <p className="intro-word">moncode</p>
        <p className="intro-sub">Pages &amp; QR codes</p>
      </div>
    </div>
  );
}
