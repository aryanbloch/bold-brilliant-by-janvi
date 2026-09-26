// Live gallery photos, managed by the admin (add/remove/reorder).
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import { GALLERY } from "@/lib/gallery.ts";

export type GalleryImage = { id: string; url: string; caption: string | null };

export function useGalleryImages() {
  const [images, setImages] = useState<GalleryImage[]>(GALLERY.map((g, i) => ({ id: String(i), url: g.url, caption: g.name })));

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from("gallery_images")
      .select("id,image_url,caption")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const rows = data as { id: string; image_url: string; caption: string | null }[] | null;
        if (rows?.length) setImages(rows.map((r) => ({ id: r.id, url: r.image_url, caption: r.caption })));
      });
  }, []);

  return images;
}
