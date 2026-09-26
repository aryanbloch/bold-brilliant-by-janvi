// Checkout requires sign in and a completed profile. The server calculates the price and saves
// the order after payment, so every order shows up automatically in "My Orders".
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";
import { useProfile } from "@/hooks/use-profile.ts";
import { supabase } from "@/lib/supabase.ts";
import { formatDeliveryAddress } from "@/lib/profile.ts";
import type { CheckoutOrder } from "@/lib/catalog.ts";
import { loadRazorpayScript, type RazorpayResponse } from "@/lib/razorpay.ts";
import SignInDialog from "./sign-in-dialog.tsx";

type Props = { order: CheckoutOrder; onClose: () => void; onSuccess?: () => void };

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function postJson<T>(url: string, token: string, body: unknown): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: (await res.json()) as T };
}

export default function CheckoutDialog({ order, onClose, onSuccess }: Props) {
  const { isSignedIn, loading: authLoading } = useCustomerAuth();
  const { profile, profileLoading, isProfileOpen, openProfile } = useProfile();
  const [showSignIn, setShowSignIn] = useState(false);
  const [step, setStep] = useState<"form" | "paying" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  // Once the auth state has finished loading, prompt sign in if the customer isn't signed in yet.
  useEffect(() => {
    if (!authLoading && !isSignedIn) setShowSignIn(true);
  }, [authLoading, isSignedIn]);

  const pay = async () => {
    if (!profile) {
      openProfile("edit");
      return;
    }
    setError(null);
    setStep("paying");
    try {
      const token = await getAccessToken();
      if (!token) {
        setStep("form");
        setShowSignIn(true);
        return;
      }
      await loadRazorpayScript();

      const { ok, data } = await postJson<{ orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string }>(
        "/api/create-order",
        token,
        { items: order.items },
      );
      if (!ok || !data.orderId || !data.keyId || !data.amount) {
        throw new Error(data.error ?? "Could not start payment. Please try again.");
      }

      const razorpay = new window.Razorpay!({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency ?? "INR",
        order_id: data.orderId,
        name: "Bold & Brilliant by Janvi Sarang",
        description: order.title,
        prefill: { name: profile.fullName, contact: `+91${profile.phone}` },
        theme: { color: "#a8285a" },
        handler: (response: RazorpayResponse) => {
          void verifyAndFinish(response, token);
        },
        modal: { ondismiss: () => setStep("form") },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const verifyAndFinish = async (response: RazorpayResponse, token: string) => {
    try {
      const { ok, data } = await postJson<{ verified?: boolean; error?: string }>("/api/verify-payment", token, {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });
      if (!ok || !data.verified) {
        throw new Error(`${data.error ?? "Payment could not be verified."} (Payment ID: ${response.razorpay_payment_id})`);
      }
      setStep("success");
      onSuccess?.();
      toast.success("Payment successful!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be verified. Please contact us on WhatsApp with your payment ID.");
      setStep("form");
    }
  };

  return (
    <>
      <Dialog open={!showSignIn && !isProfileOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          {step === "success" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-14 text-emerald-500" />
              <DialogTitle className="font-serif text-2xl">Order Confirmed!</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Your payment for {order.title} was successful. You can see your order status anytime in the "My Orders" section.
              </p>
              <button onClick={onClose} className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]">
                Done
              </button>
            </div>
          ) : (
            <>
              <DialogTitle className="font-serif text-2xl">Checkout</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {order.title} · <span className="font-medium text-primary">₹{order.total}</span>
              </p>
              <div className="grid gap-4 pt-2">
                {profileLoading ? (
                  <Skeleton className="h-28 w-full rounded-2xl" />
                ) : profile ? (
                  <div className="flex items-start justify-between gap-3 rounded-2xl border bg-card/70 p-4">
                    <div className="min-w-0 text-sm">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        <MapPin className="size-4 text-primary" /> Deliver to {profile.fullName}
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">{profile.addressType}</span>
                      </p>
                      <p className="break-words pt-1 text-muted-foreground">{formatDeliveryAddress(profile)}</p>
                      <p className="pt-1 text-muted-foreground">+91 {profile.phone}</p>
                    </div>
                    <button onClick={() => openProfile("edit")} className="shrink-0 text-sm font-medium text-primary hover:underline">
                      Change
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openProfile("edit")} className="flex h-20 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
                    <Plus className="size-4" /> Add delivery address
                  </button>
                )}
                {error && <p className="break-words text-sm text-destructive">{error}</p>}
                <button
                  onClick={pay}
                  disabled={!profile || step === "paying"}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {step === "paying" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Opening payment...
                    </>
                  ) : (
                    `Pay ₹${order.total}`
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">Secure payment powered by Razorpay. Free delivery all over India.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SignInDialog
        open={showSignIn}
        onClose={() => {
          setShowSignIn(false);
          if (!isSignedIn) onClose();
        }}
      />
    </>
  );
}
