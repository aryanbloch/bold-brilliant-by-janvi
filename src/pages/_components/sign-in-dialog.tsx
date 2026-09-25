// Sign in with Google (one tap) or email magic-link, shown before checkout so every order
// can be linked to a customer account.
import { useState } from "react";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";

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

export default function SignInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithEmail, signInWithGoogle } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in link. Please try again.");
    } finally {
      setSending(false);
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
      setSent(false);
      setEmail("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="size-14 text-primary" />
            <DialogTitle className="font-serif text-2xl">Check Your Email</DialogTitle>
            <p className="text-sm text-muted-foreground">
              We've sent a sign-in link to {email}. Open it to continue with your order - no password needed.
            </p>
          </div>
        ) : (
          <>
            <DialogTitle className="font-serif text-2xl">Sign In to Continue</DialogTitle>
            <p className="text-sm text-muted-foreground">Sign in with Google, or with just your email, to place your order and track it later.</p>

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

              <form onSubmit={submit} className="grid gap-4">
                <div>
                  <Label htmlFor="signin-email" className="pb-2">Email Address</Label>
                  <Input id="signin-email" type="email" required placeholder="you@example.com" className="h-11 rounded-xl bg-background/70" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Send Sign-In Link
                </button>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
