// Invoice design admin tab: edit the HTML template used to generate every order's invoice
// (api/invoice.ts fills in {{placeholders}} and renders it as a print-ready page/PDF).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Save } from "lucide-react";
import { adminApi } from "./api.ts";
import { AdminButton, FIELD, LABEL, Spinner } from "./ui.tsx";

type Template = { html: string; prefix: string };

const PLACEHOLDER_HELP =
  "{{brand}} {{address}} {{gstin_line}} (shows 'GSTIN: ...' only when you add a GSTIN) {{invoice_number}} {{invoice_date}} {{order_id}} {{customer_name}} {{phone}} {{customer_address}} {{items_rows}} {{subtotal}} {{coupon_code}} {{discount}} {{total}} {{payment_id}}";

export default function InvoiceTemplateTab({ password }: { password: string }) {
  const [form, setForm] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminApi.list<Template>(password, "invoice_template").then(({ ok, data }) => {
      if (ok) setForm((data as unknown as { row?: Template }).row ?? { html: "", prefix: "BB" });
      else toast.error(data.error ?? "Could not load invoice template");
    });
  }, [password]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const { ok, data } = await adminApi.update(password, "invoice_template", form);
    setSaving(false);
    if (!ok) {
      toast.error(data.error ?? "Could not save template");
      return;
    }
    toast.success("Invoice template updated");
  };

  const preview = () => {
    const w = window.open("", "_blank");
    if (!w || !form) return;
    w.document.write(`<style>body{font-family:Arial,sans-serif;margin:24px}</style>${form.html}`);
    w.document.close();
  };

  if (!form) return <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Invoice Design</h2>
      <p className="text-sm text-muted-foreground">Invoices are created when an order is dispatched. Cancelled orders show a CANCELLED stamp.</p>
      <div>
        <label className={LABEL}>Invoice Number Prefix</label>
        <input className={`${FIELD} max-w-xs`} value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} placeholder="BB" />
      </div>
      <div>
        <label className={LABEL}>Invoice HTML</label>
        <textarea className={`${FIELD} h-80 py-3 font-mono text-xs`} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} />
        <p className="pt-1 text-xs text-muted-foreground">Available placeholders: {PLACEHOLDER_HELP}</p>
      </div>
      <div className="flex gap-2">
        <AdminButton variant="secondary" onClick={preview}>
          <Eye className="size-4" /> Preview
        </AdminButton>
        <AdminButton onClick={() => void save()} disabled={saving}>
          {saving ? <Spinner /> : <Save className="size-4" />} Save
        </AdminButton>
      </div>
    </div>
  );
}
