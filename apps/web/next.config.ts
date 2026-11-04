import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Anciennes adresses : elles mènent toutes au parcours client (sans compte).
  // L'admin a ses propres adresses sous /admin. Redirections temporaires (307)
  // pour que les navigateurs ne les gardent pas en cache.
  async redirects() {
    return [
      { source: "/about", destination: "/a-propos", permanent: false },
      { source: "/connexion", destination: "/admin/connexion", permanent: false },
      { source: "/compte", destination: "/creer", permanent: false },
      { source: "/intervenant", destination: "/creer/page/informations", permanent: false },
      { source: "/restaurant", destination: "/creer/page/informations", permanent: false },
      { source: "/personnalisation", destination: "/creer/page/apparence", permanent: false },
      { source: "/qr-studio", destination: "/creer", permanent: false },
    ];
  },
};

export default nextConfig;
