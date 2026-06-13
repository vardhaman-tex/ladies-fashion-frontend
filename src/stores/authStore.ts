import { create } from "zustand";
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
      const user = await getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
