// Renders one invoice as a self-contained, print-ready HTML page by filling the admin-editable
// template (invoice_template.html) with the order's real data. The frontend fetches this with
// headers (never putting the password or sign-in token in the URL), then opens the result so the
// customer can "Save as PDF".
// Invoices exist only once an order is dispatched. Cancelled orders get a clear CANCELLED stamp.
// Access: the signed-in customer who owns the order (Authorization: Bearer <access_token>), OR the
// admin (x-admin-password header).
// Env vars (Vercel): SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL.
import { checkAdminPassword, dbFetch, escapeHtml, getEnv, getUserId, q, type ApiRequest, type ApiResponse } from "./_lib/db.js";

type InvoiceRow = { id: string; order_id: string; user_id: string; invoice_number: string; created_at: string };
type OrderRow = {
  id: string;
  product_name: string;
  amount: number;
  subtotal: number | null;
  discount: number | null;
  coupon_code: string | null;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  razorpay_payment_id: string;
  items: { name: string; qty: number; price?: number }[] | null;
};
type SiteSettings = { brand: string; address: string | null; gstin: string | null };
type Template = { html: string };

// Keys whose values are already safe HTML. Everything else is escaped before filling.
const RAW_HTML_KEYS = new Set(["items_rows", "customer_address", "address", "gstin_line"]);

function itemsRowsHtml(order: OrderRow): string {
  const items = order.items?.length ? order.items : [{ name: order.product_name, qty: 1, price: order.subtotal ?? order.amount }];
  return items
    .map((it) => {
      const price = Number(it.price ?? 0);
      const qty = Number(it.qty ?? 1);
      return `<tr><td>${escapeHtml(String(it.name))}</td><td align="center">${qty}</td><td align="right">₹${price}</td><td align="right">₹${price * qty}</td></tr>`;
    })
    .join("");
}

function fillTemplate(template: string, order: OrderRow, invoice: InvoiceRow, settings: SiteSettings | null): string {
  const subtotal = order.subtotal ?? order.amount + (order.discount ?? 0);
  const gstin = settings?.gstin?.trim();
  const replacements: Record<string, string> = {
    brand: settings?.brand ?? "Bold & Brilliant",
    address: escapeHtml(settings?.address ?? ""),
    gstin: gstin ?? "",
    gstin_line: gstin ? `GSTIN: ${escapeHtml(gstin)}` : "",
    invoice_number: invoice.invoice_number,
    invoice_date: new Date(invoice.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
    order_id: order.id.slice(0, 8).toUpperCase(),
    customer_name: order.customer_name,
    phone: order.phone,
    customer_address: escapeHtml(order.address).replace(/\n/g, "<br>"),
    items_rows: itemsRowsHtml(order),
    subtotal: String(subtotal),
    coupon_code: order.coupon_code ?? "None",
    discount: String(order.discount ?? 0),
    total: String(order.amount),
    payment_id: order.razorpay_payment_id,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = replacements[key];
    if (value === undefined) return match;
    return RAW_HTML_KEYS.has(key) ? value : escapeHtml(value);
  });
}

function sendError(res: ApiResponse, status: number, message: string) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#555"><p>${escapeHtml(message)}</p></body></html>`);
}

const CANCELLED_STAMP =
  '<div style="border:3px solid #c62828;color:#c62828;font:bold 28px Arial,sans-serif;text-align:center;padding:10px;margin-bottom:16px;letter-spacing:4px">CANCELLED</div>';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const env = getEnv();
  if (!env) {
    sendError(res, 500, "Invoices are not set up yet.");
    return;
  }
  const { supabaseUrl, serviceKey } = env;
  const orderId = q(req, "orderId");
  const invoiceId = q(req, "invoiceId");
  if (!orderId && !invoiceId) {
    sendError(res, 400, "Missing invoice reference.");
    return;
  }

  const isAdmin = checkAdminPassword(req);

  try {
    const filter = invoiceId ? `id=eq.${encodeURIComponent(invoiceId)}` : `order_id=eq.${encodeURIComponent(orderId ?? "")}`;
    const invRes = await dbFetch(supabaseUrl, serviceKey, `invoices?${filter}&select=*`);
    const invoice = ((await invRes.json()) as InvoiceRow[])[0];
    if (!invoice) {
      sendError(res, 404, "Your invoice will be available once your order is dispatched.");
      return;
    }

    if (!isAdmin) {
      const userId = await getUserId(req, supabaseUrl, serviceKey);
      if (!userId || userId !== invoice.user_id) {
        sendError(res, 403, "You do not have access to this invoice.");
        return;
      }
    }

    const [orderRes, templateRes, settingsRes] = await Promise.all([
      dbFetch(supabaseUrl, serviceKey, `orders?id=eq.${encodeURIComponent(invoice.order_id)}&select=*`),
      dbFetch(supabaseUrl, serviceKey, "invoice_template?id=eq.1&select=html"),
      dbFetch(supabaseUrl, serviceKey, "site_settings?id=eq.1&select=brand,address,gstin"),
    ]);
    const order = ((await orderRes.json()) as OrderRow[])[0];
    if (!order) {
      sendError(res, 404, "Order not found.");
      return;
    }
    const template = ((await templateRes.json()) as Template[])[0]?.html ?? "<p>Invoice template not configured.</p>";
    const settings = ((await settingsRes.json()) as SiteSettings[])[0] ?? null;

    const filled = fillTemplate(template, order, invoice, settings);
    const stamp = order.status === "Cancelled" ? CANCELLED_STAMP : "";
    const page = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${escapeHtml(invoice.invoice_number)}</title>
<style>
  @media print { body { margin: 0; } }
  body { margin: 24px; }
  table { width: 100%; border-collapse: collapse; }
</style>
</head>
<body>
${stamp}
${filled}
<script>window.onload = () => { if (${q(req, "print") === "1" ? "true" : "false"}) window.print(); };</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(page);
  } catch {
    sendError(res, 500, "Could not generate the invoice. Please try again.");
  }
}
