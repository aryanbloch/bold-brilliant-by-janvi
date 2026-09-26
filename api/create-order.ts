// Creates a Razorpay order on the server. The amount is calculated here from the price list below,
// never taken from the browser, so customers cannot change the price.
// Env vars (Vercel): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY,
// and SUPABASE_URL (falls back to VITE_SUPABASE_URL).

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

// Keep in sync with src/lib/catalog.ts.
const PRICES: Record<string, number> = {
  "Nude Glaze Set": 599,
  "Classic French Set": 649,
  "Pearl Bloom Set": 799,
  "Gold Chrome Set": 899,
  "Rosy Minimal Set": 549,
  "Sparkle Stiletto Set": 999,
};
const MAX_QTY = 20;

// Keep in sync with src/lib/coupons.ts.
const COUPONS: Record<string, { percentOff: number }> = {
  WELCOME10: { percentOff: 10 },
  BB15: { percentOff: 15 },
};

type Item = { name: string; qty: number };

function parseItems(value: unknown): Item[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;
  const items: Item[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) return null;
    const { name, qty } = raw as Record<string, unknown>;
    if (typeof name !== "string" || !(name in PRICES)) return null;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    items.push({ name, qty });
  }
  return items;
}

function applyCoupon(total: number, code: unknown): { total: number; couponCode: string | null } {
  if (typeof code !== "string" || !code.trim()) return { total, couponCode: null };
  const normalized = code.trim().toUpperCase();
  const coupon = COUPONS[normalized];
  if (!coupon) return { total, couponCode: null };
  const discounted = Math.round(total * (1 - coupon.percentOff / 100));
  return { total: discounted, couponCode: normalized };
}

// Confirms the Supabase sign-in token and returns the customer's user id.
async function getUserId(req: ApiRequest, url: string, serviceKey: string): Promise<string | null> {
  const raw = req.headers?.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header?.startsWith("Bearer ")) return null;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: header } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keyId || !keySecret || !supabaseUrl || !serviceKey) {
    res.status(500).json({ error: "Online payment is not set up yet. Please contact the studio." });
    return;
  }

  const items = parseItems((req.body as { items?: unknown } | undefined)?.items);
  if (!items) {
    res.status(400).json({ error: "Some items in your basket are no longer available. Please remove them and try again." });
    return;
  }

  try {
    const userId = await getUserId(req, supabaseUrl, serviceKey);
    if (!userId) {
      res.status(401).json({ error: "Please sign in again to continue." });
      return;
    }

    const rawTotal = items.reduce((sum, i) => sum + PRICES[i.name] * i.qty, 0);
    const { total, couponCode } = applyCoupon(rawTotal, (req.body as { couponCode?: unknown } | undefined)?.couponCode);
    const summary = items.map((i) => (i.qty > 1 ? `${i.name} x${i.qty}` : i.name)).join(", ");

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: total * 100, // Razorpay expects paise
        currency: "INR",
        // Read back in verify-payment to save the order - never trusted from the browser.
        notes: { user_id: userId, items: summary.slice(0, 220), coupon: couponCode ?? "" },
      }),
    });
    const data = (await response.json()) as { id?: string; amount?: number; currency?: string; error?: { description?: string } };

    if (!response.ok || !data.id) {
      res.status(502).json({ error: data.error?.description ?? "Could not start payment. Please try again." });
      return;
    }

    res.status(200).json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
      couponApplied: couponCode,
      discount: rawTotal - total,
    });
  } catch {
    res.status(500).json({ error: "Something went wrong while starting your payment." });
  }
}
