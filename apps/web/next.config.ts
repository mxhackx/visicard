import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Anciennes adresses : elles mènent au parcours client. /connexion et /compte sont de vraies
  // pages (espace client) ; l'admin a ses propres adresses sous /admin. Redirections temporaires (307)
  // pour que les navigateurs ne les gardent pas en cache.
  async redirects() {
    return [
      { source: "/about", destination: "/a-propos", permanent: false },
      { source: "/intervenant", destination: "/creer/page/informations", permanent: false },
      { source: "/restaurant", destination: "/creer/page/informations", permanent: false },
      { source: "/personnalisation", destination: "/creer/page/apparence", permanent: false },
      { source: "/qr-studio", destination: "/creer", permanent: false },
    ];
  },
};

export default nextConfig;
