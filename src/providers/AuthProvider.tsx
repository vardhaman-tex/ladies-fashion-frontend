"use client";

import { useEffect, type ReactNode } from "react";
import { useSessionKeepAlive } from "@/hooks/useSessionKeepAlive";
import { useAuthStore } from "@/stores/authStore";

/**
 * Initializes the global authentication state by checking for an existing
 * authenticated session when the application first loads, and keeps that
 * session from expiring underneath someone who is still using the site.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  useSessionKeepAlive();

  return <>{children}</>;
}
