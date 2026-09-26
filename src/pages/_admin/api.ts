// Shared fetch helpers for every admin tab. All requests go through the admin endpoints and
// carry the studio owner's password in the x-admin-password header (never sent from anywhere
// else in the app).
const STORAGE_KEY = "bb-admin-password";

export function getStoredPassword(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}
export function storePassword(password: string) {
  sessionStorage.setItem(STORAGE_KEY, password);
}
export function clearStoredPassword() {
  sessionStorage.removeItem(STORAGE_KEY);
}

async function request<T>(password: string, url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), "x-admin-password": password, "Content-Type": "application/json" },
  });
  // A too-large upload is rejected by Vercel with a non-JSON page, so don't crash on it.
  const data = (await res.json().catch(() => ({ error: res.status === 413 ? "Image is too large." : "Something went wrong." }))) as T;
  return { ok: res.ok, status: res.status, data };
}

export type Resource =
  | "products"
  | "coupons"
  | "promo_banners"
  | "reviews"
  | "bookings"
  | "site_settings"
  | "site_content"
  | "invoice_template";

export const adminApi = {
  list: <T>(password: string, resource: Resource) => request<{ rows?: T[]; row?: T; error?: string }>(password, `/api/admin?resource=${resource}`),
  create: <T>(password: string, resource: Resource, body: unknown) =>
    request<{ row?: T; error?: string }>(password, `/api/admin?resource=${resource}`, { method: "POST", body: JSON.stringify(body) }),
  update: <T>(password: string, resource: Resource, body: unknown) =>
    request<{ row?: T; error?: string }>(password, `/api/admin?resource=${resource}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (password: string, resource: Resource, id: string) =>
    request<{ ok?: boolean; error?: string }>(password, `/api/admin?resource=${resource}&id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  upload: (password: string, dataUrl: string, folder: string) =>
    request<{ url?: string; error?: string }>(password, "/api/admin-upload", { method: "POST", body: JSON.stringify({ dataUrl, folder }) }),
};

const MAX_DIMENSION = 1800; // px, plenty for product and banner photos
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

// Reads an image and shrinks it in the browser (max 1800px, WebP) so big phone photos
// fit under the server upload limit. GIFs are kept as-is so animations survive.
export async function fileToDataUrl(file: File): Promise<string> {
  if (file.type === "image/gif") {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("GIF is too large. Please use a file under 3MB.");
    return readAsDataUrl(file);
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return readAsDataUrl(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return readAsDataUrl(blob);
  }
  throw new Error("Image is too large. Please use a smaller photo.");
}
