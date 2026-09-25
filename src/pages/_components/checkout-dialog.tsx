import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { loadRazorpayScript, type RazorpayResponse } from "@/lib/razorpay.ts";
import { whatsappLink } from "@/lib/site-config.ts";

type Product = { name: string; price: number };

type Details = { name: string; phone: string; address: string };

const FIELD = "h-11 rounded-xl bg-background/70";

export default function CheckoutDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [details, setDetails] = useState<Details>({ name: "", phone: "", address: "" });
  const [step, setStep] = useState<"form" | "paying" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails((d) => ({ ...d, [key]: e.target.value }));

  const isValid = details.name.trim().length > 1 && /^\+?[0-9\s-]{10,15}$/.test(details.phone.trim()) && details.address.trim().length > 5;

  const sendWhatsappReceipt = () => {
    const text = `New order confirmed and paid!

Product: ${product.name}
Amount: ₹${product.price}
Name: ${details.name}
Phone: ${details.phone}
Delivery Address: ${details.address}`;
    window.open(whatsappLink(text), "_blank", "noopener");
  };

  const pay = async () => {
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
        prefill: { name: details.name, contact: details.phone },
        theme: { color: "#a8285a" },
        handler: (response: RazorpayResponse) => {
          void verifyAndFinish(response, order.orderId!);
        },
        modal: { ondismiss: () => setStep("form") },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const verifyAndFinish = async (response: RazorpayResponse, orderId: string) => {
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
      setStep("success");
      toast.success("Payment successful!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be verified. Please contact us on WhatsApp with your payment ID.");
      setStep("form");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {step === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-14 text-emerald-500" />
            <DialogTitle className="font-serif text-2xl">Order Confirmed!</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Your payment for {product.name} was successful. Please send us the confirmation on WhatsApp so we can start preparing your order.
            </p>
            <button onClick={sendWhatsappReceipt} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02]">
              Send Order Details on WhatsApp
            </button>
            <button onClick={onClose} className="pt-1 text-sm text-muted-foreground underline-offset-4 hover:underline">
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogTitle className="font-serif text-2xl">Checkout</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {product.name} · <span className="font-medium text-primary">₹{product.price}</span>
            </p>
            <div className="grid gap-4 pt-2">
              <div>
                <Label htmlFor="co-name" className="pb-2">Full Name</Label>
                <Input id="co-name" placeholder="Priya Shah" className={FIELD} value={details.name} onChange={update("name")} />
              </div>
              <div>
                <Label htmlFor="co-phone" className="pb-2">Phone Number</Label>
                <Input id="co-phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" className={FIELD} value={details.phone} onChange={update("phone")} />
              </div>
              <div>
                <Label htmlFor="co-address" className="pb-2">Delivery Address</Label>
                <Textarea id="co-address" rows={3} placeholder="House no, street, city, state, pincode" className="rounded-xl bg-background/70" value={details.address} onChange={update("address")} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                onClick={pay}
                disabled={!isValid || step === "paying"}
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
  );
}
