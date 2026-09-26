// Tracks the signed-in customer using Supabase auth (email OTP code or Google).
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

  // Sends a 6-digit one-time code to the customer's email.
  const sendEmailOtp = async (email: string) => {
    if (!supabase) throw new Error("Sign in isn't set up yet. Please contact the studio.");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw new Error(error.message);
  };

  // Verifies the 6-digit code the customer received by email and signs them in.
  const verifyEmailOtp = async (email: string, token: string) => {
    if (!supabase) throw new Error("Sign in isn't set up yet. Please contact the studio.");
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw new Error(error.message);
  };

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("Sign in isn't set up yet. Please contact the studio.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
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
    sendEmailOtp,
    verifyEmailOtp,
    signInWithGoogle,
    signOut,
  };
}
