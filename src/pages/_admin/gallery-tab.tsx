// Gallery photos admin tab: add or remove photos shown in the homepage auto-scrolling gallery
// (src/hooks/use-gallery-images.ts).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { adminApi, fileToDataUrl } from "./api.ts";
import { AdminButton, AdminCard, EmptyRow, FIELD, Toggle } from "./ui.tsx";

type GalleryImage = { id: string; image_url: string; caption: string | null; is_active: boolean };

export default function GalleryTab({ password }: { password: string }) {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const load = () => {
    void adminApi.list<GalleryImage>(password, "gallery_images").then(({ ok, data }) => {
      if (ok) setImages(data.rows ?? []);
      else toast.error(data.error ?? "Could not load gallery");
    });
  };
  useEffect(load, [password]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { ok, data } = await adminApi.upload(password, dataUrl, "gallery");
      if (!ok || !data.url) throw new Error(data.error ?? "Upload failed");
      const { ok: createOk, data: createData } = await adminApi.create(password, "gallery_images", {
        image_url: data.url,
        caption: caption.trim() || null,
        is_active: true,
        sort_order: images?.length ?? 0,
      });
      if (!createOk) throw new Error(createData.error ?? "Could not add photo");
      setCaption("");
      toast.success("Photo added");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (img: GalleryImage, value: boolean) => {
    const { ok, data } = await adminApi.update<GalleryImage>(password, "gallery_images", { id: img.id, is_active: value });
    if (!ok) {
      toast.error(data.error ?? "Could not update photo");
      return;
    }
    setImages((prev) => prev?.map((x) => (x.id === img.id ? { ...x, is_active: value } : x)) ?? null);
  };

  const remove = async (img: GalleryImage) => {
    if (!confirm("Remove this photo from the gallery?")) return;
    const { ok, data } = await adminApi.remove(password, "gallery_images", img.id);
    if (!ok) {
      toast.error(data.error ?? "Could not remove photo");
      return;
    }
    setImages((prev) => prev?.filter((x) => x.id !== img.id) ?? null);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Gallery Photos</h2>
      <AdminCard className="flex flex-wrap items-center gap-3">
        <input className={`${FIELD} max-w-xs`} placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium hover:bg-muted">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {uploading ? "Uploading..." : "Add Photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      </AdminCard>

      {images === null ? (
        <EmptyRow>Loading gallery...</EmptyRow>
      ) : images.length === 0 ? (
        <EmptyRow>No photos yet. Add your first gallery photo above.</EmptyRow>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <AdminCard key={img.id} className="space-y-2 p-3">
              <img src={img.image_url} alt={img.caption ?? "Gallery"} className="aspect-square w-full rounded-xl object-cover" />
              <Toggle checked={img.is_active} onChange={(v) => void toggleActive(img, v)} label={img.is_active ? "Visible" : "Hidden"} />
              <AdminButton variant="danger" onClick={() => void remove(img)} className="w-full">
                <Trash2 className="size-3.5" /> Remove
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
