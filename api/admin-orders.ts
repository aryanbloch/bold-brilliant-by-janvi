// Admin endpoint to list and update orders (status + tracking number), so the studio owner can
// manage orders from the /admin page instead of opening the Supabase dashboard.
// Protected by a shared admin password sent in the x-admin-password header.
// Env vars (Vercel): ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_URL
// (falls back to VITE_SUPABASE_URL).
interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

function checkPassword(req: ApiRequest): boolean {
  const raw = req.headers?.["x-admin-password"];
  const header = Array.isArray(raw) ? raw[0] : raw;
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && header === expected;
}

type Order = {
  id: string;
  product_name: string;
  amount: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  tracking_number: string | null;
  created_at: string;
};

const ALLOWED_STATUSES = ["Order placed", "Processing", "Shipped", "Out for delivery", "Delivered", "Cancelled"];

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Admin panel is not set up yet. Add ADMIN_PASSWORD in Vercel env vars." });
    return;
  }
  if (!checkPassword(req)) {
    res.status(401).json({ error: "Incorrect admin password" });
    return;
  }

  const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

  if (req.method === "GET") {
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/orders?select=id,product_name,amount,customer_name,phone,address,status,tracking_number,created_at&order=created_at.desc`,
        { headers: dbHeaders },
      );
      if (!r.ok) {
        res.status(502).json({ error: "Could not load orders." });
        return;
      }
      const orders = (await r.json()) as Order[];
      res.status(200).json({ orders });
    } catch {
      res.status(500).json({ error: "Could not load orders." });
    }
    return;
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as { id?: string; status?: string; trackingNumber?: string | null };
    if (!body.id || typeof body.status !== "string" || !ALLOWED_STATUSES.includes(body.status)) {
      res.status(400).json({ error: "Missing or invalid order id/status" });
      return;
    }
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(body.id)}`, {
        method: "PATCH",
        headers: { ...dbHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ status: body.status, tracking_number: body.trackingNumber || null }),
      });
      if (!r.ok) {
        res.status(502).json({ error: "Could not update order." });
        return;
      }
      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ error: "Could not update order." });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
