// Sign in flow:
// - Enter email -> we check if an account already exists for it.
// - Existing account -> enter password to sign in (with a "Forgot password" link that
//   verifies a fresh OTP code and lets you set a new password).
// - New email -> we send a 6-digit code, you verify it, then set a password for next time.
// Google sign-in is also offered as a one-tap shortcut.
import { useState } from "react";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4">
      <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.5-6.5C35.1 2.7 29.9.5 24 .5 14.8.5 6.9 5.9 3 13.7l7.6 5.9C12.5 13.9 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h12.7c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17.5z" />
      <path fill="#FBBC05" d="M10.6 19.6c-.5 1.5-.8 3.1-.8 4.9s.3 3.4.8 4.9l-7.6 5.9C1.5 32 .5 28.2.5 24s1-8 2.5-11.3l7.6 5.9z" />
      <path fill="#34A853" d="M24 47.5c5.9 0 10.9-2 14.5-5.3l-7.5-5.8c-2 1.4-4.6 2.2-7 2.2-6.3 0-11.5-4.4-13.4-10.1l-7.6 5.9C6.9 42.1 14.8 47.5 24 47.5z" />
    </svg>
  );
}

// Step machine for the dialog:
// email            - enter email address
// password         - existing account, enter password
// otp              - new account (or forgot-password reset), enter the emailed code
// set-password     - just verified the code, choose a password for next time
type Step = { kind: "email" } | { kind: "password" } | { kind: "otp"; forReset: boolean } | { kind: "set-password" };

async function emailHasAccount(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("email_has_account", { check_email: email });
  if (error) return false;
  return Boolean(data);
}

export default function SignInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sendEmailOtp, verifyEmailOtp, signInWithPassword, setPassword: savePassword, signInWithGoogle } = useCustomerAuth();
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [email, setEmail] = useState("");
  const [password, setPasswordValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep({ kind: "email" });
    setEmail("");
    setPasswordValue("");
    setNewPassword("");
    setCode("");
    setError(null);
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Sign in isn't set up yet. Please contact the studio.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const hasAccount = await emailHasAccount(email.trim());
      if (hasAccount) {
        setStep({ kind: "password" });
      } else {
        await sendEmailOtp(email.trim());
        setStep({ kind: "otp", forReset: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithPassword(email.trim(), password);
      // Dialog closes automatically once isSignedIn flips to true.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setError(null);
    setLoading(true);
    try {
      await sendEmailOtp(email.trim());
      setCode("");
      setStep({ kind: "otp", forReset: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyEmailOtp(email.trim(), code.trim());
      setStep({ kind: "set-password" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Please check it and try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await savePassword(newPassword);
      // Dialog closes automatically once isSignedIn flips to true.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Browser redirects to Google, so no need to reset loading here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {step.kind === "email" && (
          <>
            <DialogTitle className="font-serif text-2xl">Sign In</DialogTitle>
            <div className="grid gap-4 pt-2">
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={googleLoading}
                className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border bg-background text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={submitEmail} className="grid gap-4">
                <div>
                  <Label htmlFor="signin-email" className="pb-2">Email Address</Label>
                  <Input id="signin-email" type="email" required autoFocus placeholder="you@example.com" className="h-11 rounded-xl bg-background/70" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Continue
                </button>
              </form>
            </div>
          </>
        )}

        {step.kind === "password" && (
          <>
            <DialogTitle className="font-serif text-2xl">Enter Your Password</DialogTitle>
            <p className="text-sm text-muted-foreground">Signing in as {email}.</p>
            <form onSubmit={submitPassword} className="grid gap-4 pt-2">
              <div>
                <Label htmlFor="signin-password" className="pb-2">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  required
                  autoFocus
                  placeholder="Your password"
                  className="h-11 rounded-xl bg-background/70"
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Sign In
              </button>
              <button type="button" onClick={() => void forgotPassword()} className="text-center text-sm text-muted-foreground hover:text-primary">
                Forgot password?
              </button>
              <button type="button" onClick={reset} className="text-center text-sm text-muted-foreground hover:text-primary">
                Use a different email
              </button>
            </form>
          </>
        )}

        {step.kind === "otp" && (
          <>
            <DialogTitle className="font-serif text-2xl">Enter The Code</DialogTitle>
            <p className="text-sm text-muted-foreground">We've sent a 6-digit code to {email}. Enter it below to continue.</p>
            <form onSubmit={submitCode} className="grid gap-4 pt-2">
              <div>
                <Label htmlFor="signin-code" className="pb-2">Verification Code</Label>
                <Input
                  id="signin-code"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="h-11 rounded-xl bg-background/70 text-center text-lg tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.trim().length < 6}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Verify
              </button>
              <button type="button" onClick={reset} className="text-center text-sm text-muted-foreground hover:text-primary">
                Use a different email
              </button>
            </form>
          </>
        )}

        {step.kind === "set-password" && (
          <>
            <DialogTitle className="font-serif text-2xl">Set A Password</DialogTitle>
            <p className="text-sm text-muted-foreground">Choose a password so you can sign in faster next time.</p>
            <form onSubmit={submitNewPassword} className="grid gap-4 pt-2">
              <div>
                <Label htmlFor="signin-new-password" className="pb-2">New Password</Label>
                <Input
                  id="signin-new-password"
                  type="password"
                  required
                  autoFocus
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="h-11 rounded-xl bg-background/70"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading || newPassword.trim().length < 6}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Save & Continue
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
