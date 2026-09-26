// Loads the signed-in customer's profile and owns the sign-in + profile dialogs.
// New customers are asked to complete their details right after signing in.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import { fromRow, toRow, type ProfileRow, type ProfileValues } from "@/lib/profile.ts";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";
import { ProfileContext, type ProfileContextValue } from "@/hooks/use-profile.ts";
import SignInDialog from "@/pages/_components/sign-in-dialog.tsx";
import ProfileDialog from "./profile-dialog.tsx";

type DialogState = { kind: "none" } | { kind: "signin" } | { kind: "profile"; edit: boolean };

export default function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn, signOut } = useCustomerAuth();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<ProfileValues | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null);
      setLoadedFor(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ? fromRow(data as ProfileRow) : null);
        setLoadedFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profileLoading = !!userId && loadedFor !== userId;
  const needsProfile = !!userId && loadedFor === userId && profile === null;
  const isProfileOpen = isSignedIn && (dialog.kind === "profile" || needsProfile);

  const openProfile = useCallback(
    (mode: "view" | "edit" = "view") => {
      if (!isSupabaseConfigured) {
        toast.info("Sign in isn't set up yet. Please contact the studio.");
        return;
      }
      setDialog(isSignedIn ? { kind: "profile", edit: mode === "edit" } : { kind: "signin" });
    },
    [isSignedIn],
  );

  const saveProfile = async (values: ProfileValues) => {
    if (!supabase || !userId) throw new Error("Please sign in again.");
    const { error } = await supabase.from("profiles").upsert(toRow(userId, values));
    if (error) throw new Error(error.message);
    setProfile(values);
  };

  const handleSignOut = async () => {
    await signOut();
    setDialog({ kind: "none" });
    toast.success("Signed out");
  };

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, profileLoading, isSignedIn, isProfileOpen, openProfile }),
    [profile, profileLoading, isSignedIn, isProfileOpen, openProfile],
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
      <SignInDialog open={dialog.kind === "signin" && !isSignedIn} onClose={() => setDialog({ kind: "none" })} />
      <ProfileDialog
        open={isProfileOpen}
        required={needsProfile}
        startInEdit={dialog.kind === "profile" && dialog.edit}
        profile={profile}
        email={user?.email ?? null}
        onClose={() => setDialog({ kind: "none" })}
        onSave={saveProfile}
        onSignOut={() => void handleSignOut()}
      />
    </ProfileContext.Provider>
  );
}
