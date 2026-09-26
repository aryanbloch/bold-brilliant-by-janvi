// Admin image upload: stores a base64 image into the public "site-media" Supabase Storage
// bucket and returns its public URL, for product photos, banner images, gallery photos etc.
// Protected by the shared admin password. Env vars: ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY,
// SUPABASE_URL.
import { checkAdminPassword, getEnv, type ApiRequest, type ApiResponse } from "./_lib/db.ts";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const env = getEnv();
  if (!env || !process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Admin panel is not set up yet." });
    return;
  }
  if (!checkAdminPassword(req)) {
    res.status(401).json({ error: "Incorrect admin password" });
    return;
  }

  const body = (req.body ?? {}) as { dataUrl?: string; folder?: string };
  const match = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(body.dataUrl ?? "");
  if (!match) {
    res.status(400).json({ error: "Please choose a valid image file." });
    return;
  }
  const mime = match[1].toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) {
    res.status(400).json({ error: "Please upload a JPG, PNG, WEBP, GIF or AVIF image." });
    return;
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) {
    res.status(400).json({ error: "Image is too large. Please use a file under 5MB." });
    return;
  }

  const folder = /^[a-z0-9_-]+$/i.test(body.folder ?? "") ? body.folder : "misc";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const { supabaseUrl, serviceKey } = env;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/site-media/${path}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": mime },
      body: buffer,
    });
    if (!upload.ok) {
      res.status(502).json({ error: "Could not upload the image. Please try again." });
      return;
    }
    res.status(200).json({ url: `${supabaseUrl}/storage/v1/object/public/site-media/${path}` });
  } catch {
    res.status(500).json({ error: "Could not upload the image. Please try again." });
  }
}
