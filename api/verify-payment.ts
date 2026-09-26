// Verifies the Razorpay payment signature on the server, then saves the order to Supabase
// (an "orders" insert trigger auto-creates the invoice). Orders can only be created here, after
// a real payment, so nobody can add fake "paid" orders. If a coupon was used, also records the
// redemption (this is what enforces per-user and total usage limits).
// Env vars (Vercel): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY,
// and SUPABASE_URL (falls back to VITE_SUPABASE_URL).
import { createHmac, timingSafeEqual } from "node:crypto";
import { dbFetch, getEnv, getUserId, type ApiRequest, type ApiResponse } from "./_lib/db.ts";

type Profile = {
  full_name: string;
  phone: string;
  alt_phone: string | null;
  pincode: string;
  address_line1: string;
  address_line2: string;
  landmark: string | null;
  city: string;
  state: string;
  address_type: string;
  billing_same: boolean;
  billing_name: string | null;
  billing_address: string | null;
  gstin: string | null;
};

function formatAddress(p: Profile): string {
  const main = [p.address_line1, p.address_line2, p.landmark && `Landmark: ${p.landmark}`, `${p.city}, ${p.state} - ${p.pincode}`]
    .filter(Boolean)
    .join(", ");
  const lines = [`${main} (${p.address_type})`];
  if (p.alt_phone) lines.push(`Alternate phone: +91 ${p.alt_phone}`);
  if (!p.billing_same && p.billing_name) lines.push(`Billing: ${p.billing_name}, ${p.billing_address ?? ""}`);
  if (p.gstin) lines.push(`GSTIN: ${p.gstin}`);
  return lines.join("\n");
}

function signatureMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = (req.body ?? {}) as { orderId?: string; paymentId?: string; signature?: string };
  const { orderId, paymentId, signature } = body;
  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: "Missing payment details" });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const env = getEnv();
  if (!keyId || !keySecret || !env) {
    res.status(500).json({ error: "Payment gateway is not configured yet." });
    return;
  }
  const { supabaseUrl, serviceKey } = env;

  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (!signatureMatches(expected, signature)) {
    res.status(400).json({ error: "Payment could not be verified", verified: false });
    return;
  }

  try {
    const userId = await getUserId(req, supabaseUrl, serviceKey);
    if (!userId) {
      res.status(401).json({ error: "Your payment was received, but your session expired. Please contact us on WhatsApp with your payment ID." });
      return;
    }

    // Read amount and items from Razorpay's own copy of the order.
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const order = (await orderRes.json()) as {
      amount?: number;
      notes?: { user_id?: string; items?: string; summary?: string; coupon?: string; subtotal?: string; discount?: string };
    };
    if (!orderRes.ok || typeof order.amount !== "number" || order.notes?.user_id !== userId) {
      res.status(400).json({ error: "This payment does not match your account. Please contact us on WhatsApp with your payment ID." });
      return;
    }

    // Check if this payment was already saved (e.g. a retry) before inserting again.
    const existingRes = await dbFetch(supabaseUrl, serviceKey, `orders?razorpay_payment_id=eq.${encodeURIComponent(paymentId)}&select=id`);
    const existing = (await existingRes.json()) as { id: string }[];
    if (existing[0]) {
      res.status(200).json({ verified: true, orderId: existing[0].id });
      return;
    }

    const profileRes = await dbFetch(supabaseUrl, serviceKey, `profiles?id=eq.${userId}&select=*`);
    const profiles = (await profileRes.json()) as Profile[];
    const profile = Array.isArray(profiles) ? profiles[0] : undefined;
    if (!profile) {
      res.status(400).json({ error: "Your payment was received, but your delivery details are missing. Please contact us on WhatsApp with your payment ID." });
      return;
    }

    let items: { name: string; qty: number; price: number }[] = [];
    try {
      items = order.notes?.items ? JSON.parse(order.notes.items) : [];
    } catch {
      items = [];
    }
    const couponCode = order.notes?.coupon || null;
    const subtotal = order.notes?.subtotal ? Number(order.notes.subtotal) : order.amount / 100;
    const discount = order.notes?.discount ? Number(order.notes.discount) : 0;

    const insertRes = await dbFetch(supabaseUrl, serviceKey, "orders", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: userId,
        product_name: order.notes?.summary ?? "Nail set order",
        amount: order.amount / 100,
        items,
        subtotal,
        discount,
        coupon_code: couponCode,
        customer_name: profile.full_name,
        phone: `+91 ${profile.phone}`,
        address: formatAddress(profile),
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        status: "Order placed",
      }),
    });
    if (!insertRes.ok) {
      res.status(500).json({ error: "Your payment was received, but we could not save your order. Please contact us on WhatsApp with your payment ID." });
      return;
    }
    const savedOrders = (await insertRes.json()) as { id?: string }[];
    const savedOrderId = savedOrders[0]?.id;

    // Record the coupon redemption so usage limits are enforced (safe to skip on failure).
    if (couponCode && savedOrderId) {
      try {
        const couponRes = await dbFetch(supabaseUrl, serviceKey, `coupons?code=eq.${encodeURIComponent(couponCode)}&select=id`);
        const coupons = (await couponRes.json()) as { id: string }[];
        if (coupons[0]) {
          await dbFetch(supabaseUrl, serviceKey, "coupon_redemptions", {
            method: "POST",
            headers: { Prefer: "return=minimal,resolution=ignore-duplicates" },
            body: JSON.stringify({ coupon_id: coupons[0].id, user_id: userId, order_id: savedOrderId, discount_amount: discount }),
          });
        }
      } catch {
        // Non-critical: the order itself is already saved and paid.
      }
    }

    res.status(200).json({ verified: true, orderId: savedOrderId });
  } catch {
    res.status(500).json({ error: "Your payment was received, but something went wrong. Please contact us on WhatsApp with your payment ID." });
  }
}
