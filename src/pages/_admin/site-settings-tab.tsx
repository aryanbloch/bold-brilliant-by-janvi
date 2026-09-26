// Site contact/branding details admin tab: WhatsApp number, Instagram, address and hours,
// updated everywhere on the site instantly (src/hooks/use-site-settings.tsx reads this table).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { adminApi } from "./api.ts";
import { AdminButton, AdminCard, FIELD, LABEL, Spinner } from "./ui.tsx";

type SettingsRow = {
  brand: string;
  byline: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  email: string | null;
  instagram_user: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  maps_url: string | null;
  address: string | null;
  hours: { day: string; time: string }[] | null;
  delivery_note: string | null;
  gstin: string | null;
};

const EMPTY: SettingsRow = {
  brand: "",
  byline: "",
  whatsapp_number: "",
  phone: "",
  email: "",
  instagram_user: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  maps_url: "",
  address: "",
  hours: [],
  delivery_note: "",
  gstin: "",
};

export default function SiteSettingsTab({ password }: { password: string }) {
  const [form, setForm] = useState<SettingsRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminApi.list<SettingsRow>(password, "site_settings").then(({ ok, data }) => {
      if (ok) setForm((data as unknown as { row?: SettingsRow }).row ?? EMPTY);
      else toast.error(data.error ?? "Could not load site settings");
    });
  }, [password]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const { ok, data } = await adminApi.update(password, "site_settings", form);
    setSaving(false);
    if (!ok) {
      toast.error(data.error ?? "Could not save settings");
      return;
    }
    toast.success("Site details updated");
  };

  if (!form) return <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>;

  const hours = form.hours ?? [];
  const updateHour = (i: number, field: "day" | "time", value: string) =>
    setForm({ ...form, hours: hours.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)) });

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Contact & Site Details</h2>
      <AdminCard className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Brand Name</label>
          <input className={FIELD} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Byline</label>
          <input className={FIELD} value={form.byline ?? ""} onChange={(e) => setForm({ ...form, byline: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>WhatsApp Number (with country code, digits only)</label>
          <input className={FIELD} value={form.whatsapp_number ?? ""} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="919876543210" />
        </div>
        <div>
          <label className={LABEL}>Phone (optional)</label>
          <input className={FIELD} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Email (optional)</label>
          <input className={FIELD} value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>GSTIN (optional, shown on invoices)</label>
          <input className={FIELD} value={form.gstin ?? ""} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Instagram Username</label>
          <input className={FIELD} value={form.instagram_user ?? ""} onChange={(e) => setForm({ ...form, instagram_user: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Instagram URL</label>
          <input className={FIELD} value={form.instagram_url ?? ""} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Facebook URL (optional)</label>
          <input className={FIELD} value={form.facebook_url ?? ""} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>YouTube URL (optional)</label>
          <input className={FIELD} value={form.youtube_url ?? ""} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Google Maps Link</label>
          <input className={FIELD} value={form.maps_url ?? ""} onChange={(e) => setForm({ ...form, maps_url: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Delivery Note</label>
          <input className={FIELD} value={form.delivery_note ?? ""} onChange={(e) => setForm({ ...form, delivery_note: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Studio Address</label>
          <textarea className={`${FIELD} h-20 py-2`} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </AdminCard>

      <AdminCard className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Opening Hours</label>
          <AdminButton variant="secondary" onClick={() => setForm({ ...form, hours: [...hours, { day: "", time: "" }] })}>
            <Plus className="size-3.5" /> Add Row
          </AdminButton>
        </div>
        {hours.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input className={FIELD} placeholder="Mon - Sat" value={h.day} onChange={(e) => updateHour(i, "day", e.target.value)} />
            <input className={FIELD} placeholder="10:00 AM - 8:00 PM" value={h.time} onChange={(e) => updateHour(i, "time", e.target.value)} />
            <AdminButton variant="danger" onClick={() => setForm({ ...form, hours: hours.filter((_, idx) => idx !== i) })}>
              <Trash2 className="size-3.5" />
            </AdminButton>
          </div>
        ))}
      </AdminCard>

      <AdminButton onClick={() => void save()} disabled={saving}>
        {saving ? <Spinner /> : <Save className="size-4" />} Save Changes
      </AdminButton>
    </div>
  );
}
