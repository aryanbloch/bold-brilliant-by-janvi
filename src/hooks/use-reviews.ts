// Live customer reviews, fully managed from Admin > Reviews (nothing hardcoded).
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";

export type Review = { id: string; name: string; rating: number; text: string; photoUrl: string | null };

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from("reviews")
      .select("id,customer_name,rating,body,photo_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const rows = data as { id: string; customer_name: string; rating: number; body: string; photo_url: string | null }[] | null;
        setReviews((rows ?? []).map((r) => ({ id: r.id, name: r.customer_name, rating: r.rating, text: r.body, photoUrl: r.photo_url })));
      });
  }, []);

  return reviews;
}
