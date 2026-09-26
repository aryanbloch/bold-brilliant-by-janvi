// Single admin endpoint for every simple content table: Shop products, Coupons, Coupon
// banners, Reviews, Bookings, Site settings (contacts/hours/social toggles/booking message),
// Site content (policy pages) and the Invoice template. Protected by the shared admin password.
// Env vars (Vercel): ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL.
//
// Usage from the admin panel:
//   GET    /api/admin?resource=products                 -> list all rows
//   POST   /api/admin?resource=products                  body: fields to insert
//   PATCH  /api/admin?resource=products                  body: { id, ...fields to update }
//   DELETE /api/admin?resource=products&id=<uuid>
// Singleton resources (site_settings, invoice_template) ignore id and always target row 1.
// site_content is keyed by `key` instead of `id` (PATCH body: { key, ...fields }).
import { checkAdminPassword, dbFetch, getEnv, q, rejectWrongPassword, type ApiRequest, type ApiResponse } from "./_lib/db.js";

type Resource = {
  table: string;
  order?: string;
  // Columns a POST/PATCH may write. Keeps the endpoint from writing unexpected columns.
  writable: string[];
  singleton?: boolean; // always row id=1
  keyColumn?: string; // e.g. "key" for site_content instead of "id"
  allowInsert?: boolean;
  allowDelete?: boolean;
};

const RESOURCES: Record<string, Resource> = {
  products: {
    table: "products",
    order: "sort_order.asc",
    writable: ["name", "description", "price", "compare_at_price", "image_url", "stock", "sold_out", "is_active", "sort_order"],
    allowInsert: true,
    allowDelete: true,
  },
  coupons: {
    table: "coupons",
    order: "created_at.desc",
    writable: [
      "code", "discount_type", "discount_value", "max_discount", "min_order_amount",
      "usage_limit", "per_user_limit", "starts_at", "expires_at", "is_active",
    ],
    allowInsert: true,
    allowDelete: true,
  },
  promo_banners: {
    table: "promo_banners",
    order: "sort_order.asc",
    writable: ["title", "kind", "image_url", "html", "link_url", "coupon_id", "placement", "is_active", "starts_at", "ends_at", "sort_order"],
    allowInsert: true,
    allowDelete: true,
  },
  reviews: {
    table: "reviews",
    order: "sort_order.asc",
    writable: ["customer_name", "rating", "body", "photo_url", "is_published", "sort_order"],
    allowInsert: true,
    allowDelete: true,
  },
  bookings: {
    table: "bookings",
    order: "created_at.desc",
    writable: ["status", "admin_note"], // admin can only update status/note, never the request itself
  },
  site_settings: {
    table: "site_settings",
    writable: [
      "brand", "byline", "logo_url", "founder_photo_url", "whatsapp_number", "phone", "email",
      "instagram_user", "instagram_url", "facebook_url", "youtube_url", "maps_url", "address",
      "hours", "delivery_note", "hero_video_url", "showcase_video_url", "poster_url", "gstin",
      "show_whatsapp", "show_instagram", "booking_confirm_message",
    ],
    singleton: true,
  },
  site_content: {
    table: "site_content",
    keyColumn: "key",
    writable: ["title", "body", "format"],
  },
  invoice_template: {
    table: "invoice_template",
    writable: ["html", "prefix"],
    singleton: true,
  },
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const resourceName = q(req, "resource");
  const resource = resourceName ? RESOURCES[resourceName] : undefined;
  if (!resource) {
    res.status(400).json({ error: "Unknown or missing resource" });
    return;
  }

  const env = getEnv();
  if (!env || !process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Admin panel is not set up yet. Add ADMIN_PASSWORD in Vercel env vars." });
    return;
  }
  if (!checkAdminPassword(req)) {
    await rejectWrongPassword(res);
    return;
  }
  const { supabaseUrl, serviceKey } = env;

  try {
    if (req.method === "GET") {
      const path = resource.singleton
        ? `${resource.table}?id=eq.1&select=*`
        : `${resource.table}?select=*${resource.order ? `&order=${resource.order}` : ""}`;
      const r = await dbFetch(supabaseUrl, serviceKey, path);
      if (!r.ok) {
        res.status(502).json({ error: "Could not load data." });
        return;
      }
      const rows = (await r.json()) as unknown[];
      res.status(200).json(resource.singleton ? { row: rows[0] ?? null } : { rows });
      return;
    }

    if (req.method === "POST") {
      if (!resource.allowInsert) {
        res.status(405).json({ error: "This resource cannot be created from the admin panel." });
        return;
      }
      const body = pickWritable(req.body, resource.writable);
      const r = await dbFetch(supabaseUrl, serviceKey, resource.table, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        res.status(400).json({ error: friendlyDbError(data) });
        return;
      }
      res.status(200).json({ row: Array.isArray(data) ? data[0] : data });
      return;
    }

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const updates = pickWritable(body, resource.writable);
      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: "Nothing to update" });
        return;
      }
      let filter: string;
      if (resource.singleton) {
        filter = "id=eq.1";
      } else if (resource.keyColumn) {
        const key = body[resource.keyColumn];
        if (typeof key !== "string" || !key) {
          res.status(400).json({ error: `Missing ${resource.keyColumn}` });
          return;
        }
        filter = `${resource.keyColumn}=eq.${encodeURIComponent(key)}`;
      } else {
        const id = body.id;
        if (typeof id !== "string" || !id) {
          res.status(400).json({ error: "Missing id" });
          return;
        }
        filter = `id=eq.${encodeURIComponent(id)}`;
      }
      const r = await dbFetch(supabaseUrl, serviceKey, `${resource.table}?${filter}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(updates),
      });
      const data = await r.json();
      if (!r.ok) {
        res.status(400).json({ error: friendlyDbError(data) });
        return;
      }
      res.status(200).json({ row: Array.isArray(data) ? data[0] : data });
      return;
    }

    if (req.method === "DELETE") {
      if (!resource.allowDelete) {
        res.status(405).json({ error: "This resource cannot be deleted from the admin panel." });
        return;
      }
      const id = q(req, "id");
      if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
      }
      const r = await dbFetch(supabaseUrl, serviceKey, `${resource.table}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!r.ok) {
        res.status(400).json({ error: "Could not delete." });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch {
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

function pickWritable(body: unknown, allowed: string[]): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in source) out[key] = source[key];
  }
  return out;
}

function friendlyDbError(data: unknown): string {
  const msg = (data as { message?: string } | undefined)?.message;
  if (!msg) return "Could not save. Please check the values and try again.";
  if (msg.includes("duplicate key")) return "That code or name already exists. Please use a different one.";
  return msg;
}
