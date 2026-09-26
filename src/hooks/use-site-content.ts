// Live editable policy/about page text (privacy_policy, terms, refund_policy, shipping_policy,
// about, hero), managed from the admin panel. Body text supports plain paragraphs separated by
// blank lines; falls back to null while loading so callers can show their own static defaults.
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";

export type SiteContentKey = "privacy_policy" | "terms" | "refund_policy" | "shipping_policy" | "about" | "hero";
export type SiteContentEntry = { title: string | null; body: string };

export function useSiteContent(): Record<string, SiteContentEntry> | null {
  const [content, setContent] = useState<Record<string, SiteContentEntry> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setContent({});
      return;
    }
    supabase
      .from("site_content")
      .select("key,title,body")
      .then(({ data }) => {
        const rows = data as { key: string; title: string | null; body: string }[] | null;
        const map: Record<string, SiteContentEntry> = {};
        for (const r of rows ?? []) map[r.key] = { title: r.title, body: r.body };
        setContent(map);
      });
  }, []);

  return content;
}
