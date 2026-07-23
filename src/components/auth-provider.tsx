"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAccessToken, logto } from "@/lib/logto";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userSub: string | null;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userSub, setUserSub] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const authed = await logto.isAuthenticated();
      if (cancelled) return;
      setIsAuthenticated(authed);
      if (authed) {
        const claims = await logto.getIdTokenClaims();
        if (!cancelled) setUserSub(claims.sub);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(returnTo?: string) {
    if (returnTo) sessionStorage.setItem("oto-postlogin", returnTo);
    await logto.signIn({ redirectUri: `${window.location.origin}/callback` });
  }

  async function logout() {
    await logto.signOut(window.location.origin);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, userSub, login, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
