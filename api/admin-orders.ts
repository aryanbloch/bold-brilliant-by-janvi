// Admin endpoint to manage orders: list with search/filter/pagination, dispatch (courier +
// tracking number), update status, dashboard stats, and CSV export.
// Protected by the shared admin password (x-admin-password header).
// Env vars (Vercel): ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL.
//
//   GET    /api/admin-orders                       -> { orders, count } (supports ?status=, ?search=, ?limit=, ?offset=)
//   GET    /api/admin-orders?stats=1                -> dashboard numbers
//   GET    /api/admin-orders?export=csv             -> CSV file download
//   PATCH  /api/admin-orders   body: { id, status?, trackingNumber?, courier?, adminNote? }
import { checkAdminPassword, dbFetch, getEnv, q, type ApiRequest, type ApiResponse } from "./_lib/db.ts";

type Order = {
  id: string;
  product_name: string;
  amount: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  tracking_number: string | null;
  courier: string | null;
  coupon_code: string | null;
  discount: number;
  created_at: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  last_tracking_status: string | null;
  last_tracking_location: string | null;
};

const ALLOWED_STATUSES = ["Order placed", "Processing", "Shipped", "Out for delivery", "Delivered", "Cancelled"];
const COURIERS = ["Delhivery", "Shiprocket"];
const SELECT =
  "id,product_name,amount,customer_name,phone,address,status,tracking_number,courier,coupon_code,discount,created_at,dispatched_at,delivered_at,last_tracking_status,last_tracking_location";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const env = getEnv();
  if (!env || !process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Admin panel is not set up yet. Add ADMIN_PASSWORD in Vercel env vars." });
    return;
  }
  if (!checkAdminPassword(req)) {
    res.status(401).json({ error: "Incorrect admin password" });
    return;
  }
  const { supabaseUrl, serviceKey } = env;

  if (req.method === "GET") {
    try {
      if (q(req, "stats") === "1") {
        const today = new Date();
        const startOfDayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();

        const [totalRes, todayRes, pendingRes, revenueRes] = await Promise.all([
          dbFetch(supabaseUrl, serviceKey, "orders?select=id", { headers: { Prefer: "count=exact", Range: "0-0" } }),
          dbFetch(supabaseUrl, serviceKey, `orders?select=id&created_at=gte.${encodeURIComponent(startOfDayUtc)}`, { headers: { Prefer: "count=exact", Range: "0-0" } }),
          dbFetch(supabaseUrl, serviceKey, "orders?select=id&status=in.(Order placed,Processing,Shipped,Out for delivery)", { headers: { Prefer: "count=exact", Range: "0-0" } }),
          dbFetch(supabaseUrl, serviceKey, `orders?select=amount&status=neq.Cancelled&created_at=gte.${encodeURIComponent(startOfDayUtc)}`),
        ]);
        const count = (r: Response) => parseInt(r.headers.get("content-range")?.split("/")[1] ?? "0", 10) || 0;
        const todaysOrders = (await revenueRes.json()) as { amount: number }[];
        const todaysSales = Array.isArray(todaysOrders) ? todaysOrders.reduce((sum, o) => sum + Number(o.amount), 0) : 0;

        res.status(200).json({
          totalOrders: count(totalRes),
          ordersToday: count(todayRes),
          pendingDispatch: count(pendingRes),
          salesToday: todaysSales,
        });
        return;
      }

      const status = q(req, "status");
      const search = q(req, "search")?.trim();
      const limit = Math.min(parseInt(q(req, "limit") ?? "50", 10) || 50, 200);
      const offset = Math.max(parseInt(q(req, "offset") ?? "0", 10) || 0, 0);
      const isExport = q(req, "export") === "csv";

      const filters: string[] = [];
      if (status && ALLOWED_STATUSES.includes(status)) filters.push(`status=eq.${encodeURIComponent(status)}`);
      if (search) {
        const term = search.replace(/[%,()]/g, "");
        filters.push(`or=(customer_name.ilike.*${term}*,phone.ilike.*${term}*,product_name.ilike.*${term}*,tracking_number.ilike.*${term}*)`);
      }
      const query = filters.length ? `&${filters.join("&")}` : "";

      const range = isExport ? "" : { headers: { Range: `${offset}-${offset + limit - 1}`, Prefer: "count=exact" } };
      const r = await dbFetch(supabaseUrl, serviceKey, `orders?select=${SELECT}&order=created_at.desc${query}`, range || undefined);
      if (!r.ok) {
        res.status(502).json({ error: "Could not load orders." });
        return;
      }
      const orders = (await r.json()) as Order[];

      if (isExport) {
        const header = ["Order ID", "Date", "Customer", "Phone", "Product", "Amount", "Discount", "Coupon", "Status", "Courier", "Tracking Number", "Address"];
        const lines = [header.join(",")].concat(
          orders.map((o) =>
            [
              o.id, new Date(o.created_at).toLocaleString("en-IN"), o.customer_name, o.phone, o.product_name,
              o.amount, o.discount ?? 0, o.coupon_code ?? "", o.status, o.courier ?? "", o.tracking_number ?? "", o.address,
            ]
              .map(csvEscape)
              .join(","),
          ),
        );
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send(lines.join("\n"));
        return;
      }

      const count = parseInt(r.headers.get("content-range")?.split("/")[1] ?? "0", 10) || orders.length;
      res.status(200).json({ orders, count });
    } catch {
      res.status(500).json({ error: "Could not load orders." });
    }
    return;
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as { id?: string; status?: string; trackingNumber?: string | null; courier?: string | null; adminNote?: string };
    if (!body.id) {
      res.status(400).json({ error: "Missing order id" });
      return;
    }
    if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    if (body.courier !== undefined && body.courier !== null && !COURIERS.includes(body.courier)) {
      res.status(400).json({ error: "Invalid courier" });
      return;
    }

    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.trackingNumber !== undefined) patch.tracking_number = body.trackingNumber || null;
    if (body.courier !== undefined) patch.courier = body.courier || null;
    if (body.adminNote !== undefined) patch.admin_note = body.adminNote;
    // Dispatching: setting a tracking number for the first time also stamps dispatched_at and
    // moves the status to Shipped (unless the admin explicitly chose a different status).
    if (body.trackingNumber && body.status === undefined) {
      patch.status = "Shipped";
      patch.dispatched_at = new Date().toISOString();
    } else if (body.trackingNumber && body.status === "Shipped") {
      patch.dispatched_at = new Date().toISOString();
    }

    try {
      const r = await dbFetch(supabaseUrl, serviceKey, `orders?id=eq.${encodeURIComponent(body.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
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
