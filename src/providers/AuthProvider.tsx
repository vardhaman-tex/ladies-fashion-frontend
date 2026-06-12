"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";

/**
 * Initializes the global authentication state by checking for an existing
 * authenticated session when the application first loads.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
