// Coupon banner admin tab: every banner is written in HTML (with a live preview) and you choose
// where it shows - top bar, hero, shop, checkout, or a popup.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { adminApi } from "./api.ts";
import { AdminButton, AdminCard, EmptyRow, FIELD, LABEL, Spinner, Toggle } from "./ui.tsx";

type Banner = {
  id: string;
  title: string;
  html: string | null;
  link_url: string | null;
  placement: "top_bar" | "hero" | "shop" | "popup" | "checkout";
  is_active: boolean;
};

const PLACEMENTS: { value: Banner["placement"]; label: string }[] = [
  { value: "top_bar", label: "Top bar (every page)" },
  { value: "hero", label: "Homepage hero" },
  { value: "shop", label: "Shop page" },
  { value: "checkout", label: "Checkout" },
  { value: "popup", label: "Popup (once per visit)" },
];

const SAMPLE_HTML = `<div style="background:linear-gradient(90deg,#ec4899,#a855f7);color:#fff;padding:16px;border-radius:16px;text-align:center;font-family:sans-serif">
  <b style="font-size:18px">Flat 15% OFF</b><br>Use code <b>BB15</b> at checkout
</div>`;

type FormState = { title: string; html: string; linkUrl: string; placement: Banner["placement"]; isActive: boolean };
const EMPTY_FORM: FormState = { title: "", html: SAMPLE_HTML, linkUrl: "", placement: "shop", isActive: true };

export default function BannersTab({ password }: { password: string }) {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [editing, setEditing] = useState<Banner | null | "new">(null);

  const load = () => {
    void adminApi.list<Banner>(password, "promo_banners").then(({ ok, data }) => {
      if (ok) setBanners(data.rows ?? []);
      else toast.error(data.error ?? "Could not load banners");
    });
  };
  useEffect(load, [password]);

  const toggleActive = async (b: Banner, value: boolean) => {
    const { ok, data } = await adminApi.update<Banner>(password, "promo_banners", { id: b.id, is_active: value });
    if (!ok) {
      toast.error(data.error ?? "Could not update banner");
      return;
    }
    setBanners((prev) => prev?.map((x) => (x.id === b.id ? { ...x, is_active: value } : x)) ?? null);
  };

  const remove = async (b: Banner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    const { ok, data } = await adminApi.remove(password, "promo_banners", b.id);
    if (!ok) {
      toast.error(data.error ?? "Could not delete banner");
      return;
    }
    setBanners((prev) => prev?.filter((x) => x.id !== b.id) ?? null);
    toast.success("Banner deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Coupon Banners</h2>
        <AdminButton onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New Banner
        </AdminButton>
      </div>

      {banners === null ? (
        <EmptyRow>Loading banners...</EmptyRow>
      ) : banners.length === 0 ? (
        <EmptyRow>No banners yet. Create one to promote a coupon or offer.</EmptyRow>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <AdminCard key={b.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" />
                <p className="font-medium">{b.title}</p>
              </div>
              {b.html && <div className="overflow-hidden rounded-xl border" dangerouslySetInnerHTML={{ __html: b.html }} />}
              <p className="text-xs text-muted-foreground">{PLACEMENTS.find((p) => p.value === b.placement)?.label}</p>
              <Toggle checked={b.is_active} onChange={(v) => void toggleActive(b, v)} label={b.is_active ? "Active" : "Off"} />
              <div className="flex gap-2 pt-1">
                <AdminButton variant="secondary" onClick={() => setEditing(b)} className="flex-1">
                  <Pencil className="size-3.5" /> Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => void remove(b)}>
                  <Trash2 className="size-3.5" />
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {editing && (
        <BannerFormDialog
          password={password}
          banner={editing === "new" ? null : editing}
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

function BannerFormDialog({ password, banner, onClose, onSaved }: { password: string; banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(
    banner
      ? { title: banner.title, html: banner.html ?? "", linkUrl: banner.link_url ?? "", placement: banner.placement, isActive: banner.is_active }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!form.html.trim()) {
      setError("Please enter the banner HTML.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      title: form.title.trim(),
      kind: "html",
      image_url: null,
      html: form.html,
      link_url: form.linkUrl.trim() || null,
      placement: form.placement,
      is_active: form.isActive,
    };
    const { ok, data } = banner
      ? await adminApi.update(password, "promo_banners", { id: banner.id, ...body })
      : await adminApi.create(password, "promo_banners", body);
    setSaving(false);
    if (!ok) {
      setError(data.error ?? "Could not save banner");
      return;
    }
    toast.success(banner ? "Banner updated" : "Banner created");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="font-serif text-2xl">{banner ? "Edit Banner" : "New Banner"}</DialogTitle>
        <div className="grid gap-4 pt-2">
          <div>
            <label className={LABEL}>Title (for your reference)</label>
            <input className={FIELD} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Diwali Sale Banner" />
          </div>
          <div>
            <label className={LABEL}>Banner HTML</label>
            <textarea className={`${FIELD} h-40 py-2 font-mono text-xs`} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Live Preview</label>
            <div className="min-h-16 overflow-hidden rounded-xl border bg-background p-2" dangerouslySetInnerHTML={{ __html: form.html }} />
          </div>
          <div>
            <label className={LABEL}>Link (optional, e.g. #shop)</label>
            <input className={FIELD} value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="#shop" />
          </div>
          <div>
            <label className={LABEL}>Where should it appear?</label>
            <select className={FIELD} value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as Banner["placement"] })}>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
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
