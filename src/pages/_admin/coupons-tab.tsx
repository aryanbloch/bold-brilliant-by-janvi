// Coupons admin tab: create coupons (code, % or ₹ off, minimum order, expiry, usage limits,
// on/off). The checkout server (api/create-order.ts) validates against this same table, so
// whatever the admin creates here is exactly what works at checkout.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { adminApi } from "./api.ts";
import { AdminButton, AdminCard, EmptyRow, FIELD, LABEL, Spinner, Toggle } from "./ui.tsx";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number;
  usage_limit: number | null;
  per_user_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

type FormState = {
  code: string;
  discountType: "percent" | "flat";
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  usageLimit: string;
  perUserLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  code: "",
  discountType: "percent",
  discountValue: "",
  maxDiscount: "",
  minOrderAmount: "",
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
  isActive: true,
};

export default function CouponsTab({ password }: { password: string }) {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [editing, setEditing] = useState<Coupon | null | "new">(null);

  const load = () => {
    void adminApi.list<Coupon>(password, "coupons").then(({ ok, data }) => {
      if (ok) setCoupons(data.rows ?? []);
      else toast.error(data.error ?? "Could not load coupons");
    });
  };
  useEffect(load, [password]);

  const toggleActive = async (c: Coupon, value: boolean) => {
    const { ok, data } = await adminApi.update<Coupon>(password, "coupons", { id: c.id, is_active: value });
    if (!ok) {
      toast.error(data.error ?? "Could not update coupon");
      return;
    }
    setCoupons((prev) => prev?.map((x) => (x.id === c.id ? { ...x, is_active: value } : x)) ?? null);
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    const { ok, data } = await adminApi.remove(password, "coupons", c.id);
    if (!ok) {
      toast.error(data.error ?? "Could not delete coupon");
      return;
    }
    setCoupons((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
    toast.success("Coupon deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Coupons</h2>
        <AdminButton onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New Coupon
        </AdminButton>
      </div>

      {coupons === null ? (
        <EmptyRow>Loading coupons...</EmptyRow>
      ) : coupons.length === 0 ? (
        <EmptyRow>No coupons yet. Create one to offer a discount at checkout.</EmptyRow>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <AdminCard key={c.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <p className="font-mono text-lg font-semibold">{c.code}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                {c.max_discount ? ` (max ₹${c.max_discount})` : ""} · Min order ₹{c.min_order_amount}
              </p>
              <p className="text-xs text-muted-foreground">
                Used {c.used_count}
                {c.usage_limit ? ` / ${c.usage_limit}` : ""} times
                {c.per_user_limit ? ` · ${c.per_user_limit} per customer` : ""}
              </p>
              {c.expires_at && <p className="text-xs text-muted-foreground">Expires {new Date(c.expires_at).toLocaleDateString("en-IN")}</p>}
              <Toggle checked={c.is_active} onChange={(v) => void toggleActive(c, v)} label={c.is_active ? "Active" : "Off"} />
              <div className="flex gap-2 pt-1">
                <AdminButton variant="secondary" onClick={() => setEditing(c)} className="flex-1">
                  <Pencil className="size-3.5" /> Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => void remove(c)}>
                  <Trash2 className="size-3.5" />
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {editing && (
        <CouponFormDialog
          password={password}
          coupon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CouponFormDialog({ password, coupon, onClose, onSaved }: { password: string; coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(
    coupon
      ? {
          code: coupon.code,
          discountType: coupon.discount_type,
          discountValue: String(coupon.discount_value),
          maxDiscount: coupon.max_discount ? String(coupon.max_discount) : "",
          minOrderAmount: String(coupon.min_order_amount),
          usageLimit: coupon.usage_limit ? String(coupon.usage_limit) : "",
          perUserLimit: coupon.per_user_limit ? String(coupon.per_user_limit) : "",
          expiresAt: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
          isActive: coupon.is_active,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    if (!/^[A-Z0-9]{3,30}$/.test(code)) {
      setError("Code must be 3-30 letters/numbers, no spaces.");
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (form.discountType === "percent" && discountValue > 100)) {
      setError("Please enter a valid discount value.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      code,
      discount_type: form.discountType,
      discount_value: discountValue,
      max_discount: form.maxDiscount ? Number(form.maxDiscount) : null,
      min_order_amount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      usage_limit: form.usageLimit ? Number(form.usageLimit) : null,
      per_user_limit: form.perUserLimit ? Number(form.perUserLimit) : null,
      expires_at: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      is_active: form.isActive,
    };
    const { ok, data } = coupon
      ? await adminApi.update(password, "coupons", { id: coupon.id, ...body })
      : await adminApi.create(password, "coupons", body);
    setSaving(false);
    if (!ok) {
      setError(data.error ?? "Could not save coupon");
      return;
    }
    toast.success(coupon ? "Coupon updated" : "Coupon created");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-serif text-2xl">{coupon ? "Edit Coupon" : "New Coupon"}</DialogTitle>
        <div className="grid gap-4 pt-2">
          <div>
            <label className={LABEL}>Coupon Code</label>
            <input className={`${FIELD} font-mono uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Discount Type</label>
              <select className={FIELD} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "percent" | "flat" })}>
                <option value="percent">% Off</option>
                <option value="flat">₹ Off</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Value</label>
              <input type="number" min="0" className={FIELD} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
          </div>
          {form.discountType === "percent" && (
            <div>
              <label className={LABEL}>Max discount amount (optional, ₹)</label>
              <input type="number" min="0" className={FIELD} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
          )}
          <div>
            <label className={LABEL}>Minimum order amount (₹)</label>
            <input type="number" min="0" className={FIELD} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Total usage limit (optional)</label>
              <input type="number" min="1" className={FIELD} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            </div>
            <div>
              <label className={LABEL}>Per-customer limit (optional)</label>
              <input type="number" min="1" className={FIELD} value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Expiry date (optional)</label>
            <input type="date" className={FIELD} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label={form.isActive ? "Active" : "Off"} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <AdminButton variant="secondary" onClick={onClose} className="flex-1">Cancel</AdminButton>
            <AdminButton onClick={() => void save()} disabled={saving} className="flex-1">
              {saving && <Spinner />} Save
            </AdminButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
