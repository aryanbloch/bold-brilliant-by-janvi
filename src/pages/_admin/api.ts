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
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

export type Resource =
  | "products"
  | "coupons"
  | "promo_banners"
  | "gallery_images"
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

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}
