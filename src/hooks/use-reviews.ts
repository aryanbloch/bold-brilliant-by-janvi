// Live customer reviews, managed by the admin (add/remove/reorder, publish/unpublish).
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import { REVIEWS } from "@/lib/reviews.ts";

export type Review = { id: string; name: string; rating: number; text: string; photoUrl: string | null };

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>(
    REVIEWS.map((r, i) => ({ id: String(i), name: r.name, rating: r.rating, text: r.text, photoUrl: null })),
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from("reviews")
      .select("id,customer_name,rating,body,photo_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const rows = data as { id: string; customer_name: string; rating: number; body: string; photo_url: string | null }[] | null;
        if (rows?.length) setReviews(rows.map((r) => ({ id: r.id, name: r.customer_name, rating: r.rating, text: r.body, photoUrl: r.photo_url })));
      });
  }, []);

  return reviews;
}
