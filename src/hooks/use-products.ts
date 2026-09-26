// Live shop products from the database (admin-managed). Only active products are visible here
// thanks to the "Public can view active products" RLS policy - sold out / hidden ones never
// reach the browser unless the admin explicitly marked them active.
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  stock: number | null;
  soldOut: boolean;
};

type Row = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  stock: number | null;
  sold_out: boolean;
};

const fromRow = (r: Row): Product => ({
  id: r.id,
  name: r.name,
  description: r.description,
  price: r.price,
  compareAtPrice: r.compare_at_price,
  imageUrl: r.image_url,
  stock: r.stock,
  soldOut: r.sold_out,
});

export function useProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setProducts([]);
      return;
    }
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setProducts(((data as Row[] | null) ?? []).map(fromRow)));
  }, []);

  return products;
}
