// Verifies the Razorpay payment signature on the server, then saves the order to Supabase.
// Orders can only be created here, after a real payment, so nobody can add fake "paid" orders.
// Env vars (Vercel): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY,
// and SUPABASE_URL (falls back to VITE_SUPABASE_URL).
import { createHmac, timingSafeEqual } from "node:crypto";

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

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

async function getUserId(req: ApiRequest, url: string, serviceKey: string): Promise<string | null> {
  const raw = req.headers?.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header?.startsWith("Bearer ")) return null;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: header } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

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
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keyId || !keySecret || !supabaseUrl || !serviceKey) {
    res.status(500).json({ error: "Payment gateway is not configured yet." });
    return;
  }

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
    const order = (await orderRes.json()) as { amount?: number; notes?: { user_id?: string; items?: string } };
    if (!orderRes.ok || typeof order.amount !== "number" || order.notes?.user_id !== userId) {
      res.status(400).json({ error: "This payment does not match your account. Please contact us on WhatsApp with your payment ID." });
      return;
    }

    const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, { headers: dbHeaders });
    const profiles = (await profileRes.json()) as Profile[];
    const profile = Array.isArray(profiles) ? profiles[0] : undefined;
    if (!profile) {
      res.status(400).json({ error: "Your payment was received, but your delivery details are missing. Please contact us on WhatsApp with your payment ID." });
      return;
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: "POST",
      headers: { ...dbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        product_name: order.notes.items ?? "Nail set order",
        amount: order.amount / 100,
        customer_name: profile.full_name,
        phone: `+91 ${profile.phone}`,
        address: formatAddress(profile),
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        status: "Order placed",
      }),
    });
    // 409 = this payment was already saved (e.g. a retry) - that's fine.
    if (!insertRes.ok && insertRes.status !== 409) {
      res.status(500).json({ error: "Your payment was received, but we could not save your order. Please contact us on WhatsApp with your payment ID." });
      return;
    }

    res.status(200).json({ verified: true });
  } catch {
    res.status(500).json({ error: "Your payment was received, but something went wrong. Please contact us on WhatsApp with your payment ID." });
  }
}
