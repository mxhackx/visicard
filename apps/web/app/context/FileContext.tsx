"use client";

import { API_URL } from "@/lib/api-url";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export type UserRole = "user" | "admin" | null;
export type AuthRole = "admin" | "user" | null;

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string | null;
  /** Photo de profil (connexion Google). */
  picture?: string | null;
  /** Téléphone du compte (+indicatif) : sert au paiement Mobile Money. */
  phone?: string | null;
}

export interface UserInfo {
  userName: string;
  clientName: string;
  workDone: string;
  amountReceived: string;
  currency: string;
}

export interface RestaurantInfo {
  restaurantName: string;
  address: string;
  locationUrl: string;
  phoneNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  snapchatUrl: string;
  additionalInfo: string;
  schedule: Record<string, { isOpen: boolean; open: string; close: string }>;
  logoFile: File | null;
  logoPreview: string | null;
  menuFiles: File[];
  menuPreviews: string[];
  placeFiles: File[];
  placePreviews: string[];
}

export interface CustomizationInfo {
  themeId: string;
  cardLayout: string;
  qrStyle: string;
  /** Secteur d'activité : règle les libellés du formulaire et le style proposé. */
  sector: string;
}

const initialUserInfo: UserInfo = {
  userName: "",
  clientName: "",
  workDone: "",
  amountReceived: "",
  currency: "fcfa",
};

const initialRestaurantInfo: RestaurantInfo = {
  restaurantName: "",
  address: "",
  locationUrl: "",
  phoneNumber: "",
  facebookUrl: "",
  instagramUrl: "",
  xUrl: "",
  snapchatUrl: "",
  additionalInfo: "",
  schedule: {
    monday: { isOpen: true, open: "09:00", close: "22:00" },
    tuesday: { isOpen: true, open: "09:00", close: "22:00" },
    wednesday: { isOpen: true, open: "09:00", close: "22:00" },
    thursday: { isOpen: true, open: "09:00", close: "22:00" },
    friday: { isOpen: true, open: "09:00", close: "23:00" },
    saturday: { isOpen: true, open: "10:00", close: "23:00" },
    sunday: { isOpen: false, open: "10:00", close: "15:00" },
  },
  logoFile: null,
  logoPreview: null,
  menuFiles: [],
  menuPreviews: [],
  placeFiles: [],
  placePreviews: [],
};

const initialCustomization: CustomizationInfo = {
  themeId: "",
    cardLayout: "classic",
  qrStyle: "",
  sector: "",
};

interface FileContextType {
  file: File | null;
  previewUrl: string | null;
  setFile: (file: File | null) => void;
  clearFile: () => void;
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => void;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo | ((prev: UserInfo) => UserInfo)) => void;
  resetUserInfo: () => void;
  // Données Restaurant
  restaurantInfo: RestaurantInfo;
  setRestaurantInfo: (info: RestaurantInfo | ((prev: RestaurantInfo) => RestaurantInfo)) => void;
  setRestaurantLogo: (file: File | null) => void;
  addMenuFiles: (files: File[]) => void;
  removeMenuFile: (index: number) => void;
  addPlaceFiles: (files: File[]) => void;
  removePlaceFile: (index: number) => void;
  // Personnalisation Thème & QR
  customization: CustomizationInfo;
  setThemeId: (themeId: string) => void;
  setCardLayout: (layoutId: string) => void;
  setSector: (sectorId: string, layoutId: string) => void;
  setQrStyle: (qrStyle: string) => void;
  resetAll: () => void;

  // Authentification unifiée et gestion des tokens
  authToken: string | null;
  refreshToken: string | null;
  authRole: AuthRole;
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  loginSession: (
    token: string,
    role: "admin" | "user",
    user?: AuthUser,
    refreshToken?: string,
  ) => void;
  logoutSession: () => void;
  /** Met à jour le profil affiché (nom, téléphone) sans changer de session. */
  updateAuthUser: (patch: Partial<AuthUser>) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

/** Date d'expiration (en secondes) d'un jeton JWT, lue sans vérifier sa signature ; 0 si illisible. */
function tokenExpiry(token: string | null): number {
  try {
    const part = token?.split(".")[1];
    if (!part) return 0;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : 0;
  } catch {
    return 0;
  }
}

/** Au chargement : un jeton d'accès expiré avec un jeton de rafraîchissement valide se renouvelle avant tout appel. */
function startupNeedsRefresh(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const access = localStorage.getItem("moncode_token") || localStorage.getItem("moncode_admin_token");
    const refresh = localStorage.getItem("moncode_refresh_token");
    return Boolean(refresh) && tokenExpiry(access) * 1000 < Date.now() + 30_000;
  } catch {
    return false;
  }
}

export function FileProvider({ children }: { children: ReactNode }) {
  const [file, setFileState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(initialRestaurantInfo);
  const [customization, setCustomization] = useState<CustomizationInfo>(initialCustomization);

  // Authentification initialisée depuis localStorage : la session survit à la fermeture du navigateur
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return (
          localStorage.getItem("moncode_token") ||
          localStorage.getItem("moncode_admin_token")
        );
      } catch {
        return null;
      }
    }
    return null;
  });

  const [authRole, setAuthRole] = useState<AuthRole>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedRole = localStorage.getItem("moncode_role") as AuthRole;
        const storedToken =
          localStorage.getItem("moncode_token") ||
          localStorage.getItem("moncode_admin_token");
        return storedRole || (storedToken ? "admin" : null);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedEmail = localStorage.getItem("moncode_user_email");
        const picture = localStorage.getItem("moncode_user_picture");
        const name = localStorage.getItem("moncode_user_name");
        const phone = localStorage.getItem("moncode_user_phone");
        return storedEmail ? { email: storedEmail, picture: picture || null, name: name || null, phone: phone || null } : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("moncode_refresh_token");
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(startupNeedsRefresh);

  const loginSession = (
    token: string,
    role: "admin" | "user",
    user?: AuthUser,
    newRefreshToken?: string,
  ) => {
    setAuthToken(token);
    setAuthRole(role);
    setSelectedRole(role);
    if (user) {
      setAuthUser(user);
    }
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }

    try {
      localStorage.setItem("moncode_token", token);
      localStorage.setItem("moncode_role", role);
      if (role === "admin") {
        localStorage.setItem("moncode_admin_token", token);
      }
      if (user?.email) {
        localStorage.setItem("moncode_user_email", user.email);
      }
      if (user) {
        if (user.picture) localStorage.setItem("moncode_user_picture", user.picture);
        else localStorage.removeItem("moncode_user_picture");
        if (user.name) localStorage.setItem("moncode_user_name", user.name);
        else localStorage.removeItem("moncode_user_name");
        if (user.phone) localStorage.setItem("moncode_user_phone", user.phone);
        else localStorage.removeItem("moncode_user_phone");
      }
      if (newRefreshToken) {
        localStorage.setItem("moncode_refresh_token", newRefreshToken);
      }
    } catch {
      // ignore
    }
  };

  const updateAuthUser = (patch: Partial<AuthUser>) => {
    setAuthUser((prev) => ({ ...(prev ?? {}), ...patch }));
    try {
      if (patch.name !== undefined) {
        if (patch.name) localStorage.setItem("moncode_user_name", patch.name);
        else localStorage.removeItem("moncode_user_name");
      }
      if (patch.phone !== undefined) {
        if (patch.phone) localStorage.setItem("moncode_user_phone", patch.phone);
        else localStorage.removeItem("moncode_user_phone");
      }
    } catch {
      // ignore
    }
  };

  const logoutSession = () => {
    setAuthToken(null);
    setRefreshToken(null);
    setAuthRole(null);
    setSelectedRole(null);
    setAuthUser(null);

    try {
      localStorage.removeItem("moncode_token");
      localStorage.removeItem("moncode_refresh_token");
      localStorage.removeItem("moncode_role");
      localStorage.removeItem("moncode_admin_token");
      localStorage.removeItem("moncode_user_email");
      localStorage.removeItem("moncode_user_picture");
      localStorage.removeItem("moncode_user_name");
      localStorage.removeItem("moncode_user_phone");
      localStorage.removeItem("genqr_admin_token");
      localStorage.removeItem("visitcard_admin_token");
    } catch {
      // ignore
    }
  };

  const refreshing = useRef<Promise<string | null> | null>(null);
  const refreshAccessToken = (): Promise<string | null> => {
    // Un seul renouvellement à la fois : les appels simultanés partagent le même résultat.
    if (refreshing.current) return refreshing.current;
    const run = (async (): Promise<string | null> => {
      const currentRefreshToken =
        refreshToken ||
        (typeof window !== "undefined" ? localStorage.getItem("moncode_refresh_token") : null);

      if (!currentRefreshToken) {
        logoutSession();
        return null;
      }

      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: currentRefreshToken }),
        });

        // Refus de l'API (jeton expiré, révoqué, compte supprimé) : session terminée. Une panne passagère, non.
        if (res.status === 401 || res.status === 403 || res.status === 400) {
          logoutSession();
          return null;
        }
        if (!res.ok) return null;

        const data = await res.json();
        const newAccessToken: string = data.access_token;
        const nextRefreshToken: string | undefined = data.refresh_token;

        if (newAccessToken) {
          setAuthToken(newAccessToken);
          try {
            localStorage.setItem("moncode_token", newAccessToken);
            if ((data.user?.role ?? authRole) === "admin") {
              localStorage.setItem("moncode_admin_token", newAccessToken);
            }
          } catch {
            // ignore
          }
        }
        if (nextRefreshToken) {
          setRefreshToken(nextRefreshToken);
          try {
            localStorage.setItem("moncode_refresh_token", nextRefreshToken);
          } catch {
            // ignore
          }
        }
        if (data.user) {
          setAuthUser((prev) => ({ ...(prev ?? {}), ...data.user }));
          if (data.user.role) setAuthRole(data.user.role);
        }
        return newAccessToken ?? null;
      } catch {
        // Réseau instable : on garde la session, le prochain essai se fera plus tard.
        return null;
      }
    })().finally(() => {
      refreshing.current = null;
      setIsAuthLoading(false);
    });
    refreshing.current = run;
    return run;
  };

  // Renouvellement automatique : une minute avant l'expiration du jeton d'accès, et au retour sur l'onglet.
  useEffect(() => {
    if (!authToken && !refreshToken) return;
    const check = () => {
      const left = tokenExpiry(authToken) * 1000 - Date.now();
      if (!authToken || left < 60_000) void refreshAccessToken();
    };
    check();
    const left = tokenExpiry(authToken) * 1000 - Date.now();
    const timer = left > 60_000 ? window.setTimeout(() => void refreshAccessToken(), Math.min(left - 60_000, 2_000_000_000)) : undefined;
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, refreshToken]);

  const setFile = (newFile: File | null) => {
    setFileState(newFile);
    setPreviewUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return newFile ? URL.createObjectURL(newFile) : null;
    });
  };

  const clearFile = () => setFile(null);
  const resetUserInfo = () => setUserInfo(initialUserInfo);

  const setRestaurantLogo = (logoFile: File | null) => {
    setRestaurantInfo((prev) => {
      if (prev.logoPreview) {
        URL.revokeObjectURL(prev.logoPreview);
      }
      return {
        ...prev,
        logoFile,
        logoPreview: logoFile ? URL.createObjectURL(logoFile) : null,
      };
    });
  };

  const addMenuFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setRestaurantInfo((prev) => ({
      ...prev,
      menuFiles: [...prev.menuFiles, ...newFiles],
      menuPreviews: [...prev.menuPreviews, ...newPreviews],
    }));
  };

  const removeMenuFile = (index: number) => {
    setRestaurantInfo((prev) => {
      const newFiles = [...prev.menuFiles];
      newFiles.splice(index, 1);

      const newPreviews = [...prev.menuPreviews];
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
      }

      return { ...prev, menuFiles: newFiles, menuPreviews: newPreviews };
    });
  };

  const addPlaceFiles = (files: File[]) => {
    const previews = files.map((f) => URL.createObjectURL(f));
    setRestaurantInfo((prev) => ({
      ...prev,
      placeFiles: [...prev.placeFiles, ...files],
      placePreviews: [...prev.placePreviews, ...previews],
    }));
  };

  const removePlaceFile = (index: number) => {
    setRestaurantInfo((prev) => {
      const newFiles = [...prev.placeFiles];
      newFiles.splice(index, 1);

      const newPreviews = [...prev.placePreviews];
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
      }

      return { ...prev, placeFiles: newFiles, placePreviews: newPreviews };
    });
  };

  const setCardLayout = (cardLayout: string) => {
    setCustomization((prev) => ({ ...prev, cardLayout }));
  };

  const setSector = (sector: string, cardLayout: string) => {
    // Changer de secteur repart de la palette d'origine du style proposé.
    setCustomization((prev) => ({ ...prev, sector, cardLayout, themeId: "" }));
  };

  const setThemeId = (themeId: string) => {
    setCustomization((prev) => ({ ...prev, themeId }));
  };

  const setQrStyle = (qrStyle: string) => {
    setCustomization((prev) => ({ ...prev, qrStyle }));
  };

  const resetAll = () => {
    clearFile();
    resetUserInfo();
    setRestaurantInfo((prev) => {
      if (prev.logoPreview) URL.revokeObjectURL(prev.logoPreview);
      prev.menuPreviews.forEach((p) => URL.revokeObjectURL(p));
      return initialRestaurantInfo;
    });
    setCustomization(initialCustomization);
  };

  return (
    <FileContext.Provider
      value={{
        file,
        previewUrl,
        setFile,
        clearFile,
        hasSeenIntro,
        setHasSeenIntro,
        selectedRole,
        setSelectedRole,
        userInfo,
        setUserInfo,
        resetUserInfo,
        restaurantInfo,
        setRestaurantInfo,
        setRestaurantLogo,
        addMenuFiles,
        removeMenuFile,
        addPlaceFiles,
        removePlaceFile,
        customization,
        setThemeId,
        setCardLayout,
        setSector,
        setQrStyle,
        resetAll,
        authToken,
        refreshToken,
        authRole,
        authUser,
        isAuthLoading,
        loginSession,
        logoutSession,
        updateAuthUser,
        refreshAccessToken,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFile must be used within a FileProvider");
  }
  return context;
}
