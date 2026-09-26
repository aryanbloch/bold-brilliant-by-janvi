// Site contact/branding details admin tab: WhatsApp number, Instagram, address and hours, plus
// on/off switches for the floating WhatsApp / Instagram / Facebook / YouTube / X / Telegram
// icons shown to customers.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { adminApi } from "./api.ts";
import { AdminButton, AdminCard, FIELD, LABEL, Spinner, Toggle } from "./ui.tsx";

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
  x_url: string | null;
  telegram_url: string | null;
  maps_url: string | null;
  address: string | null;
  hours: { day: string; time: string }[] | null;
  delivery_note: string | null;
  gstin: string | null;
  show_whatsapp: boolean;
  show_instagram: boolean;
  show_facebook: boolean;
  show_youtube: boolean;
  show_x: boolean;
  show_telegram: boolean;
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
  x_url: "",
  telegram_url: "",
  maps_url: "",
  address: "",
  hours: [],
  delivery_note: "",
  gstin: "",
  show_whatsapp: true,
  show_instagram: true,
  show_facebook: false,
  show_youtube: false,
  show_x: false,
  show_telegram: false,
};

const TEXT_FIELDS: { key: keyof SettingsRow; label: string; placeholder?: string }[] = [
  { key: "brand", label: "Brand Name" },
  { key: "byline", label: "Byline" },
  { key: "whatsapp_number", label: "WhatsApp Number (with country code, digits only)", placeholder: "919876543210" },
  { key: "phone", label: "Phone (optional)" },
  { key: "email", label: "Email (optional)" },
  { key: "gstin", label: "GSTIN (optional, shown on invoices)" },
  { key: "instagram_user", label: "Instagram Username" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "youtube_url", label: "YouTube URL" },
  { key: "x_url", label: "X (Twitter) URL" },
  { key: "telegram_url", label: "Telegram URL" },
  { key: "maps_url", label: "Google Maps Link" },
  { key: "delivery_note", label: "Delivery Note" },
];

// Each social icon: which text field holds its link, and which boolean switches it on/off.
const SOCIAL_TOGGLES: { key: keyof SettingsRow; label: string; linkKey: keyof SettingsRow }[] = [
  { key: "show_whatsapp", label: "WhatsApp", linkKey: "whatsapp_number" },
  { key: "show_instagram", label: "Instagram", linkKey: "instagram_url" },
  { key: "show_facebook", label: "Facebook", linkKey: "facebook_url" },
  { key: "show_youtube", label: "YouTube", linkKey: "youtube_url" },
  { key: "show_x", label: "X (Twitter)", linkKey: "x_url" },
  { key: "show_telegram", label: "Telegram", linkKey: "telegram_url" },
];

export default function SiteSettingsTab({ password }: { password: string }) {
  const [form, setForm] = useState<SettingsRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminApi.list<SettingsRow>(password, "site_settings").then(({ ok, data }) => {
      if (ok) setForm({ ...EMPTY, ...((data as unknown as { row?: SettingsRow }).row ?? {}) });
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
      <h2 className="font-serif text-2xl">Contact & Social</h2>

      <AdminCard className="space-y-3">
        <p className="text-sm font-medium">Floating icons on the website</p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_TOGGLES.map((t) => (
            <Toggle
              key={t.key}
              checked={Boolean(form[t.key])}
              onChange={(v) => setForm({ ...form, [t.key]: v })}
              label={`${t.label}: ${form[t.key] ? "On" : "Off"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Fill in the matching URL below for each icon you switch on.</p>
      </AdminCard>

      <AdminCard className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className={LABEL}>{f.label}</label>
            <input
              className={FIELD}
              placeholder={f.placeholder}
              value={String(form[f.key] ?? "")}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
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
