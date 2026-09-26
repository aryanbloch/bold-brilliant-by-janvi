// Renders one invoice as a self-contained, print-ready HTML page by filling the admin-editable
// template (invoice_template.html) with the order's real data. The frontend opens this URL
// (with the customer's Supabase access token, or the admin password, as a query param - since
// a plain link/new-tab request can't send custom headers) and prints it to PDF using the
// browser's own "Save as PDF" - the same approach Amazon/Flipkart invoices use, so no extra
// PDF-rendering service or paid dependency is needed.
// Access: the signed-in customer who owns the order (?token=<access_token>), OR the admin
// (?adminPassword=... or the x-admin-password header).
// Env vars (Vercel): SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL.
import { checkAdminPassword, dbFetch, escapeHtml, getEnv, q, type ApiRequest, type ApiResponse } from "./_lib/db.js";

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
  razorpay_payment_id: string;
  items: { name: string; qty: number; price?: number }[] | null;
};
type SiteSettings = { brand: string; address: string | null; gstin: string | null };
type Template = { html: string };

async function getUserIdFromToken(token: string | undefined, supabaseUrl: string, serviceKey: string): Promise<string | null> {
  if (!token) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

function itemsRowsHtml(order: OrderRow): string {
  const items = order.items?.length ? order.items : [{ name: order.product_name, qty: 1, price: order.subtotal ?? order.amount }];
  return items
    .map((it) => {
      const price = it.price ?? 0;
      const qty = it.qty ?? 1;
      return `<tr><td>${escapeHtml(it.name)}</td><td align="center">${qty}</td><td align="right">₹${price}</td><td align="right">₹${price * qty}</td></tr>`;
    })
    .join("");
}

function fillTemplate(template: string, order: OrderRow, invoice: InvoiceRow, settings: SiteSettings | null): string {
  const subtotal = order.subtotal ?? order.amount + (order.discount ?? 0);
  const replacements: Record<string, string> = {
    brand: settings?.brand ?? "Bold & Brilliant",
    address: settings?.address ?? "",
    gstin: settings?.gstin ?? "-",
    invoice_number: invoice.invoice_number,
    invoice_date: new Date(invoice.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
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
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => replacements[key] ?? match);
}

function sendError(res: ApiResponse, status: number, message: string) {
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#555"><p>${escapeHtml(message)}</p></body></html>`);
}

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

  const isAdmin = checkAdminPassword(req) || (process.env.ADMIN_PASSWORD && q(req, "adminPassword") === process.env.ADMIN_PASSWORD);

  try {
    const filter = invoiceId ? `id=eq.${encodeURIComponent(invoiceId)}` : `order_id=eq.${encodeURIComponent(orderId ?? "")}`;
    const invRes = await dbFetch(supabaseUrl, serviceKey, `invoices?${filter}&select=*`);
    const invoices = (await invRes.json()) as InvoiceRow[];
    const invoice = invoices[0];
    if (!invoice) {
      sendError(res, 404, "Invoice not found.");
      return;
    }

    if (!isAdmin) {
      const userId = await getUserIdFromToken(q(req, "token"), supabaseUrl, serviceKey);
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
    const orders = (await orderRes.json()) as OrderRow[];
    const order = orders[0];
    if (!order) {
      sendError(res, 404, "Order not found.");
      return;
    }
    const templates = (await templateRes.json()) as Template[];
    const settingsRows = (await settingsRes.json()) as SiteSettings[];
    const template = templates[0]?.html ?? "<p>Invoice template not configured.</p>";

    const filled = fillTemplate(template, order, invoice, settingsRows[0] ?? null);
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
${filled}
<script>window.onload = () => { if (new URLSearchParams(location.search).get("print") === "1") window.print(); };</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(page);
  } catch {
    sendError(res, 500, "Could not generate the invoice. Please try again.");
  }
}
