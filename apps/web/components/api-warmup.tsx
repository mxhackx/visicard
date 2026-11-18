"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api-url";

/** Réveille l'API (hébergement gratuit mis en veille) dès l'arrivée sur le site, avant la première vraie requête. */
export default function ApiWarmup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    try {
      if (sessionStorage.getItem("moncode_warm")) return;
      sessionStorage.setItem("moncode_warm", "1");
    } catch {}
    fetch(`${API_URL}/`, { mode: "no-cors", cache: "no-store", keepalive: true }).catch(() => {});
  }, []);
  return null;
}
