// Coupon banner admin tab: create a banner (photo upload or raw HTML) and choose where it
// shows - top bar, hero, shop, checkout, or a popup. Reads from the same promo_banners table
// the site renders from (src/hooks/use-promo-banners.ts).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { adminApi, fileToDataUrl } from "./api.ts";
import { AdminButton, AdminCard, EmptyRow, FIELD, LABEL, Spinner, Toggle } from "./ui.tsx";

type Banner = {
  id: string;
  title: string;
  kind: "image" | "html";
  image_url: string | null;
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

type FormState = { title: string; kind: "image" | "html"; imageUrl: string; html: string; linkUrl: string; placement: Banner["placement"]; isActive: boolean };
const EMPTY_FORM: FormState = { title: "", kind: "image", imageUrl: "", html: "", linkUrl: "", placement: "shop", isActive: true };

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
              {b.kind === "image" && b.image_url && <img src={b.image_url} alt={b.title} className="h-24 w-full rounded-xl object-cover" />}
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
      ? { title: banner.title, kind: banner.kind, imageUrl: banner.image_url ?? "", html: banner.html ?? "", linkUrl: banner.link_url ?? "", placement: banner.placement, isActive: banner.is_active }
      : EMPTY_FORM,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { ok, data } = await adminApi.upload(password, dataUrl, "banners");
      if (!ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setForm((f) => ({ ...f, imageUrl: data.url! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (form.kind === "image" && !form.imageUrl) {
      setError("Please upload a banner image.");
      return;
    }
    if (form.kind === "html" && !form.html.trim()) {
      setError("Please enter the banner HTML.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      title: form.title.trim(),
      kind: form.kind,
      image_url: form.kind === "image" ? form.imageUrl : null,
      html: form.kind === "html" ? form.html : null,
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-serif text-2xl">{banner ? "Edit Banner" : "New Banner"}</DialogTitle>
        <div className="grid gap-4 pt-2">
          <div>
            <label className={LABEL}>Title (for your reference)</label>
            <input className={FIELD} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Diwali Sale Banner" />
          </div>
          <div>
            <label className={LABEL}>Banner Type</label>
            <div className="flex gap-2">
              <AdminButton variant={form.kind === "image" ? "primary" : "secondary"} onClick={() => setForm({ ...form, kind: "image" })} className="flex-1">Photo</AdminButton>
              <AdminButton variant={form.kind === "html" ? "primary" : "secondary"} onClick={() => setForm({ ...form, kind: "html" })} className="flex-1">HTML Box</AdminButton>
            </div>
          </div>
          {form.kind === "image" ? (
            <div>
              <label className={LABEL}>Banner Image</label>
              <div className="flex items-center gap-3">
                {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="h-14 w-24 rounded-lg object-cover" />}
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium hover:bg-muted">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  {uploading ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className={LABEL}>Banner HTML</label>
              <textarea className={`${FIELD} h-32 py-2 font-mono text-xs`} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} placeholder="<div style='...'>Use code BB15 for 15% off!</div>" />
            </div>
          )}
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
