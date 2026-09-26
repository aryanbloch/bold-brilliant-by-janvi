// Renders one invoice as a self-contained, print-ready HTML page by filling the admin-editable
// template (invoice_template.html) with the order's real data. The frontend fetches this HTML
// (with the customer's Supabase token, or the admin password) and prints it to PDF using the
// browser's own "Save as PDF" - the same approach Amazon/Flipkart invoices use, so no extra
// PDF-rendering service or paid dependency is needed.
// Access: the signed-in customer who owns the order, OR the admin (x-admin-password header).
// Env vars (Vercel): SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL.
import { checkAdminPassword, dbFetch, escapeHtml, getEnv, getUserId, q, type ApiRequest, type ApiResponse } from "./_lib/db.ts";

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const env = getEnv();
  if (!env) {
    res.status(500).json({ error: "Invoices are not set up yet." });
    return;
  }
  const { supabaseUrl, serviceKey } = env;
  const orderId = q(req, "orderId");
  const invoiceId = q(req, "invoiceId");
  if (!orderId && !invoiceId) {
    res.status(400).json({ error: "Missing orderId or invoiceId" });
    return;
  }

  const isAdmin = checkAdminPassword(req);

  try {
    const filter = invoiceId ? `id=eq.${encodeURIComponent(invoiceId)}` : `order_id=eq.${encodeURIComponent(orderId ?? "")}`;
    const invRes = await dbFetch(supabaseUrl, serviceKey, `invoices?${filter}&select=*`);
    const invoices = (await invRes.json()) as InvoiceRow[];
    const invoice = invoices[0];
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found." });
      return;
    }

    if (!isAdmin) {
      const userId = await getUserId(req, supabaseUrl, serviceKey);
      if (!userId || userId !== invoice.user_id) {
        res.status(403).json({ error: "You do not have access to this invoice." });
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
      res.status(404).json({ error: "Order not found." });
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
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(page);
  } catch {
    res.status(500).json({ error: "Could not generate the invoice. Please try again." });
  }
}
