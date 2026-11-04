"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useFile } from "../context/FileContext";

export default function ConnexionPage() {
  const router = useRouter();
  const { loginSession, authToken, authRole, isAuthLoading } = useFile();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && authToken && authRole) {
      if (authRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/intervenant");
      }
    }
  }, [authToken, authRole, isAuthLoading, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please fill in your credentials.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
      const res = await fetch(`${apiUrl}/auth/login`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Invalid credentials");
      }
      const data = await res.json();
      const role: "admin" | "user" = data.user?.role === "admin" ? "admin" : "user";
      loginSession(data.access_token, role, { id: data.user?.id, email: data.user?.email }, data.refresh_token);
      
      if (role === "admin") router.push("/admin");
      else router.push("/intervenant");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F8FC] flex flex-col relative font-sans text-slate-900">
      {/* HEADER LOGO */}
      <header className="absolute top-0 left-0 p-8 flex items-center gap-2">
        <img src="/logo.svg" alt="MonCode Logo" className="h-6 w-6" />
        <span className="font-bold text-xl tracking-tight text-[#1E293B]">MonCode</span>
      </header>

      {/* CENTER CONTENT */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] shadow-sm border border-slate-100 rounded-[12px] p-10 bg-white">
          <div className="text-center mb-8">
            <h1 className="text-[24px] font-bold text-[#111827]">Bienvenue!</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                type="text"
                placeholder="Entrez votre email"
                className="w-full pl-[42px] h-12 rounded-[6px] border border-slate-200 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
            </div>
            <div className="relative mt-4">
              <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                className="w-full pl-[42px] pr-10 h-12 rounded-[6px] border border-slate-200 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {error && <div className="text-sm text-red-500 font-medium text-center pb-2">{error}</div>}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-[6px] bg-[#4E7BF2] hover:bg-[#3D66D6] disabled:opacity-70 text-white font-semibold text-[15px] shadow-sm transition-colors"
              >
                {isLoading ? "Connexion en cours..." : "Connexion"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
