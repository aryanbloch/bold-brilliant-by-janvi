// Live, admin-editable site settings (WhatsApp number, Instagram, address, hours, media...).
// Falls back to the defaults in site-config.ts while loading or if the row is missing, so the
// site never shows blank contact details.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import { SITE } from "@/lib/site-config.ts";

export type SiteHour = { day: string; time: string };
export type SiteSettingsValues = {
  brand: string;
  byline: string;
  logoUrl: string;
  founderPhotoUrl: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  instagramUser: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  mapsUrl: string;
  address: string;
  hours: SiteHour[];
  deliveryNote: string;
  heroVideoUrl: string;
  showcaseVideoUrl: string;
  posterUrl: string;
  gstin: string;
};

const DEFAULTS: SiteSettingsValues = {
  brand: SITE.brand,
  byline: SITE.byline,
  logoUrl: SITE.logo,
  founderPhotoUrl: SITE.founderPhoto,
  whatsappNumber: SITE.whatsappNumber,
  phone: "",
  email: "",
  instagramUser: SITE.instagramUser,
  instagramUrl: SITE.instagramUrl,
  facebookUrl: "",
  youtubeUrl: "",
  mapsUrl: SITE.mapsUrl,
  address: SITE.address,
  hours: [...SITE.hours],
  deliveryNote: SITE.delivery,
  heroVideoUrl: SITE.videos.hero,
  showcaseVideoUrl: SITE.videos.showcase,
  posterUrl: SITE.poster,
  gstin: "",
};

type Row = {
  brand: string;
  byline: string | null;
  logo_url: string | null;
  founder_photo_url: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  email: string | null;
  instagram_user: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  maps_url: string | null;
  address: string | null;
  hours: SiteHour[] | null;
  delivery_note: string | null;
  hero_video_url: string | null;
  showcase_video_url: string | null;
  poster_url: string | null;
  gstin: string | null;
};

function fromRow(r: Row): SiteSettingsValues {
  return {
    brand: r.brand || DEFAULTS.brand,
    byline: r.byline ?? DEFAULTS.byline,
    logoUrl: r.logo_url ?? DEFAULTS.logoUrl,
    founderPhotoUrl: r.founder_photo_url ?? DEFAULTS.founderPhotoUrl,
    whatsappNumber: r.whatsapp_number ?? DEFAULTS.whatsappNumber,
    phone: r.phone ?? DEFAULTS.phone,
    email: r.email ?? DEFAULTS.email,
    instagramUser: r.instagram_user ?? DEFAULTS.instagramUser,
    instagramUrl: r.instagram_url ?? DEFAULTS.instagramUrl,
    facebookUrl: r.facebook_url ?? DEFAULTS.facebookUrl,
    youtubeUrl: r.youtube_url ?? DEFAULTS.youtubeUrl,
    mapsUrl: r.maps_url ?? DEFAULTS.mapsUrl,
    address: r.address ?? DEFAULTS.address,
    hours: r.hours?.length ? r.hours : DEFAULTS.hours,
    deliveryNote: r.delivery_note ?? DEFAULTS.deliveryNote,
    heroVideoUrl: r.hero_video_url ?? DEFAULTS.heroVideoUrl,
    showcaseVideoUrl: r.showcase_video_url ?? DEFAULTS.showcaseVideoUrl,
    posterUrl: r.poster_url ?? DEFAULTS.posterUrl,
    gstin: r.gstin ?? DEFAULTS.gstin,
  };
}

const SiteSettingsContext = createContext<SiteSettingsValues>(DEFAULTS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsValues>(DEFAULTS);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(fromRow(data as Row));
      });
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export const whatsappLinkFor = (whatsappNumber: string, text?: string) =>
  `https://wa.me/${whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
