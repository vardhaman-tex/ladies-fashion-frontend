import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { logout as logoutRequest } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

/**
 * Convenience hook exposing the current authentication state and a logout
 * action that clears both server-side and client-side session state.
 */
export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const clearUser = useAuthStore((state) => state.clearUser);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearUser();
      router.push("/login");
    }
  }, [clearUser, router]);

  return { user, isAuthenticated, isLoading, logout };
}
