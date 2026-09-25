// Tracks the signed-in customer using Supabase email magic-link auth.
// Returns null user when Supabase isn't configured yet so the rest of the site keeps working.
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";

export function useCustomerAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string) => {
    if (!supabase) throw new Error("Sign in isn't set up yet. Please contact the studio.");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return {
    user: session?.user ?? null,
    isSignedIn: !!session?.user,
    loading,
    signInWithEmail,
    signOut,
  };
}
