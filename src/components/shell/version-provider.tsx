"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { writeCookie } from "@/lib/sidebar-cookies";
import { VERSION_COOKIE, type AppVersion } from "@/lib/version-cookie";

type VersionContextValue = {
  version: AppVersion;
  toggleVersion: () => void;
};

const VersionContext = createContext<VersionContextValue | null>(null);

export function useAppVersion() {
  const context = useContext(VersionContext);
  if (!context) throw new Error("useAppVersion must be used within VersionProvider");
  return context;
}

export function VersionProvider({
  defaultVersion,
  children,
}: {
  defaultVersion: AppVersion;
  children: ReactNode;
}) {
  const [version, setVersion] = useState(defaultVersion);

  useEffect(() => {
    writeCookie(VERSION_COOKIE, version);
  }, [version]);

  const toggleVersion = () => setVersion((v) => (v === "v0" ? "v1" : "v0"));

  return (
    <VersionContext.Provider value={{ version, toggleVersion }}>{children}</VersionContext.Provider>
  );
}
