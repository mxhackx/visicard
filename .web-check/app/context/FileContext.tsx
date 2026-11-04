"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "user" | "admin" | null;
export type AuthRole = "admin" | "user" | null;

export interface AuthUser {
  id?: string;
  email?: string;
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
  themeId: "theme-1",
    cardLayout: "classic",
  qrStyle: "style-1",
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
  refreshAccessToken: () => Promise<string | null>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [file, setFileState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(initialRestaurantInfo);
  const [customization, setCustomization] = useState<CustomizationInfo>(initialCustomization);

  // Authentification initialisée depuis sessionStorage
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return (
          sessionStorage.getItem("moncode_token") ||
          sessionStorage.getItem("moncode_admin_token")
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
        const storedRole = sessionStorage.getItem("moncode_role") as AuthRole;
        const storedToken =
          sessionStorage.getItem("moncode_token") ||
          sessionStorage.getItem("moncode_admin_token");
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
        const storedEmail = sessionStorage.getItem("moncode_user_email");
        return storedEmail ? { email: storedEmail } : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("moncode_refresh_token");
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthLoading] = useState<boolean>(false);

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
      sessionStorage.setItem("moncode_token", token);
      sessionStorage.setItem("moncode_role", role);
      if (role === "admin") {
        sessionStorage.setItem("moncode_admin_token", token);
      }
      if (user?.email) {
        sessionStorage.setItem("moncode_user_email", user.email);
      }
      if (newRefreshToken) {
        sessionStorage.setItem("moncode_refresh_token", newRefreshToken);
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
      sessionStorage.removeItem("moncode_token");
      sessionStorage.removeItem("moncode_refresh_token");
      sessionStorage.removeItem("moncode_role");
      sessionStorage.removeItem("moncode_admin_token");
      sessionStorage.removeItem("moncode_user_email");
      sessionStorage.removeItem("genqr_admin_token");
      sessionStorage.removeItem("visitcard_admin_token");
    } catch {
      // ignore
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const currentRefreshToken =
      refreshToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("moncode_refresh_token")
        : null);

    if (!currentRefreshToken) {
      logoutSession();
      return null;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
      const res = await fetch(`${apiUrl}/auth/refresh`, {
      credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });

      if (!res.ok) {
        logoutSession();
        return null;
      }

      const data = await res.json();
      const newAccessToken: string = data.access_token;
      const nextRefreshToken: string | undefined = data.refresh_token;

      if (newAccessToken) {
        setAuthToken(newAccessToken);
        try {
          sessionStorage.setItem("moncode_token", newAccessToken);
          if (authRole === "admin") {
            sessionStorage.setItem("moncode_admin_token", newAccessToken);
          }
        } catch {
          // ignore
        }
      }

      if (nextRefreshToken) {
        setRefreshToken(nextRefreshToken);
        try {
          sessionStorage.setItem("moncode_refresh_token", nextRefreshToken);
        } catch {
          // ignore
        }
      }

      if (data.user) {
        setAuthUser(data.user);
        if (data.user.role) {
          setAuthRole(data.user.role);
        }
      }

      return newAccessToken;
    } catch {
      logoutSession();
      return null;
    }
  };

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
        setQrStyle,
        resetAll,
        authToken,
        refreshToken,
        authRole,
        authUser,
        isAuthLoading,
        loginSession,
        logoutSession,
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
