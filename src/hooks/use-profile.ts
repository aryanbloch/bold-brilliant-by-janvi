import { createContext, useContext } from "react";
import type { ProfileValues } from "@/lib/profile.ts";

export type ProfileContextValue = {
  profile: ProfileValues | null;
  profileLoading: boolean;
  isSignedIn: boolean;
  isProfileOpen: boolean;
  // Opens sign in when signed out, otherwise the profile (optionally straight into the edit form).
  openProfile: (mode?: "view" | "edit") => void;
};

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
