import { create } from "zustand";
import { onSessionExpired } from "@/lib/api";
import { getMe } from "@/services/authService";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

/**
 * Global authentication state store. Holds the current user's profile and
 * tracks whether the initial authentication check has completed.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
  initAuth: async () => {
    set({ isLoading: true });
    try {
      // Silent: a not-signed-in visitor must land on the shop, not on /login.
      const user = await getMe(true);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

/**
 * Keeps the store honest when a token refresh finally fails: whatever request
 * discovered the dead session, the UI should stop claiming someone is signed
 * in. Registered at module scope so it is wired up exactly once, before any
 * component renders.
 */
if (typeof window !== "undefined") {
  onSessionExpired(() => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  });
}
