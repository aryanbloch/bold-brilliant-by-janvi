// Email magic-link sign in, shown before checkout so every order can be linked to a customer account.
import { useState } from "react";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";

export default function SignInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithEmail } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
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
            <p className="text-sm text-muted-foreground">Enter your email to sign in and track your order later. We'll send you a one-click sign-in link.</p>
            <form onSubmit={submit} className="grid gap-4 pt-2">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
