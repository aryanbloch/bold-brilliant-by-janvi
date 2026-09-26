// Checkout requires sign in and a completed profile, so every paid order has full delivery and
// billing details and shows up automatically in "My Orders".
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";
import { useProfile } from "@/hooks/use-profile.ts";
import { supabase } from "@/lib/supabase.ts";
import { formatDeliveryAddress, formatOrderAddress, type ProfileValues } from "@/lib/profile.ts";
import { loadRazorpayScript, type RazorpayResponse } from "@/lib/razorpay.ts";
import SignInDialog from "./sign-in-dialog.tsx";

type Product = { name: string; price: number };

type Props = { product: Product; onClose: () => void; onSuccess?: () => void };

export default function CheckoutDialog({ product, onClose, onSuccess }: Props) {
  const { user, isSignedIn, loading: authLoading } = useCustomerAuth();
  const { profile, profileLoading, isProfileOpen, openProfile } = useProfile();
  const [showSignIn, setShowSignIn] = useState(false);
  const [step, setStep] = useState<"form" | "paying" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  // Once the auth state has finished loading, prompt sign in if the customer isn't signed in yet.
  useEffect(() => {
    if (!authLoading && !isSignedIn) setShowSignIn(true);
  }, [authLoading, isSignedIn]);

  const pay = async () => {
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }
    if (!profile) {
      openProfile("edit");
      return;
    }
    const details = profile;
    setError(null);
    setStep("paying");
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: product.price, name: product.name }),
      });
      const order = (await orderRes.json()) as { orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string };
      if (!orderRes.ok || !order.orderId || !order.keyId) {
        throw new Error(order.error ?? "Could not start payment. Please try again.");
      }

      const razorpay = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount ?? product.price * 100,
        currency: order.currency ?? "INR",
        order_id: order.orderId,
        name: "Bold & Brilliant by Janvi Sarang",
        description: product.name,
        prefill: { name: details.fullName, contact: `+91${details.phone}` },
        theme: { color: "#a8285a" },
        handler: (response: RazorpayResponse) => {
          void verifyAndFinish(response, order.orderId!, details);
        },
        modal: { ondismiss: () => setStep("form") },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const verifyAndFinish = async (response: RazorpayResponse, orderId: string, details: ProfileValues) => {
    try {
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      });
      const result = (await verifyRes.json()) as { verified?: boolean; error?: string };
      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error ?? "Payment could not be verified.");
      }

      if (supabase && user) {
        await supabase.from("orders").insert({
          user_id: user.id,
          product_name: product.name,
          amount: product.price,
          customer_name: details.fullName,
          phone: `+91 ${details.phone}`,
          address: formatOrderAddress(details),
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: orderId,
          status: "Order placed",
        });
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
                Your payment for {product.name} was successful. You can see your order status anytime in the "My Orders" section.
              </p>
              <button onClick={onClose} className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]">
                Done
              </button>
            </div>
          ) : (
            <>
              <DialogTitle className="font-serif text-2xl">Checkout</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {product.name} · <span className="font-medium text-primary">₹{product.price}</span>
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
                {error && <p className="text-sm text-destructive">{error}</p>}
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
                    `Pay ₹${product.price}`
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
