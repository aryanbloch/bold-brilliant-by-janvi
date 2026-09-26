// Live coupon banners the admin created in the admin panel (image or HTML), filtered by
// placement (top_bar / hero / shop / popup / checkout). Only active, currently-running banners
// are ever returned to the browser thanks to the "Public can view live banners" RLS policy.
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";

export type PromoBanner = {
  id: string;
  title: string;
  kind: "image" | "html";
  imageUrl: string | null;
  html: string | null;
  linkUrl: string | null;
  placement: "top_bar" | "hero" | "shop" | "popup" | "checkout";
};

type Row = {
  id: string;
  title: string;
  kind: "image" | "html";
  image_url: string | null;
  html: string | null;
  link_url: string | null;
  placement: PromoBanner["placement"];
};

const fromRow = (r: Row): PromoBanner => ({
  id: r.id,
  title: r.title,
  kind: r.kind,
  imageUrl: r.image_url,
  html: r.html,
  linkUrl: r.link_url,
  placement: r.placement,
});

export function usePromoBanners(placement: PromoBanner["placement"]) {
  const [banners, setBanners] = useState<PromoBanner[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from("promo_banners")
      .select("id,title,kind,image_url,html,link_url,placement")
      .eq("placement", placement)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setBanners(((data as Row[] | null) ?? []).map(fromRow)));
  }, [placement]);

  return banners;
}
