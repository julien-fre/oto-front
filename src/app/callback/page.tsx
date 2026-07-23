"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logto, purgeLogtoStorage } from "@/lib/logto";

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await logto.handleSignInCallback(window.location.href);
        if (cancelled) return;
        sessionStorage.removeItem("oto-auth-retry");
        const dest = sessionStorage.getItem("oto-postlogin") || "/";
        sessionStorage.removeItem("oto-postlogin");
        router.replace(dest);
      } catch {
        if (cancelled) return;
        // Stale PKCE state (leftover tenant/appId switch, or a doubled
        // sign-in attempt) — purge and retry sign-in once before giving up.
        // Mirrors oto-dashboard's useAuth.initAuth.
        purgeLogtoStorage();
        if (!sessionStorage.getItem("oto-auth-retry")) {
          sessionStorage.setItem("oto-auth-retry", "1");
          await logto.signIn({ redirectUri: `${window.location.origin}/callback` });
          return;
        }
        sessionStorage.removeItem("oto-auth-retry");
        setError("We couldn't complete sign-in. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-body text-muted">
        {error ?? "Signing you in…"}
      </p>
    </div>
  );
}
