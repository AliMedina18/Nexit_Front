"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types/domain";

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string) => AuthUser;
  logout: () => void;
  setHydrated: () => void;
}

function buildUserFromEmail(email: string): AuthUser {
  const namePart = email.split("@")[0]?.replace(/[._]/g, " ") ?? "Usuario";
  const displayName =
    namePart
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ") || "Usuario";
  const initials =
    displayName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U";
  return { email, displayName, initials };
}

/**
 * Demo auth: any email/password combination "succeeds" (matches the design
 * mockup's login screen note). This will be replaced by real calls against
 * the .NET identity/auth endpoints once they're ready — only this file and
 * the login form need to change.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      login: (email: string) => {
        const user = buildUserFromEmail(email);
        set({ user });
        return user;
      },
      logout: () => set({ user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "nexus-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
