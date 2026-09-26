// Full studio admin panel: sign in with the admin password, then manage every part of the
// website - dashboard, orders (dispatch/tracking), shop products, coupons, banners, bookings,
// gallery, reviews, contact/site details, policy text, and the invoice design.
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { clearStoredPassword, getStoredPassword, storePassword } from "./_admin/api.ts";
import DashboardTab from "./_admin/dashboard-tab.tsx";
import OrdersTab from "./_admin/orders-tab.tsx";
import ProductsTab from "./_admin/products-tab.tsx";
import CouponsTab from "./_admin/coupons-tab.tsx";
import BannersTab from "./_admin/banners-tab.tsx";
import BookingsTab from "./_admin/bookings-tab.tsx";
import GalleryTab from "./_admin/gallery-tab.tsx";
import ReviewsTab from "./_admin/reviews-tab.tsx";
import SiteSettingsTab from "./_admin/site-settings-tab.tsx";
import ContentTab from "./_admin/content-tab.tsx";
import InvoiceTemplateTab from "./_admin/invoice-template-tab.tsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", Component: DashboardTab },
  { id: "orders", label: "Orders", Component: OrdersTab },
  { id: "products", label: "Shop", Component: ProductsTab },
  { id: "coupons", label: "Coupons", Component: CouponsTab },
  { id: "banners", label: "Banners", Component: BannersTab },
  { id: "bookings", label: "Bookings", Component: BookingsTab },
  { id: "gallery", label: "Gallery", Component: GalleryTab },
  { id: "reviews", label: "Reviews", Component: ReviewsTab },
  { id: "settings", label: "Contact & Site", Component: SiteSettingsTab },
  { id: "content", label: "Website Text", Component: ContentTab },
  { id: "invoice", label: "Invoice Design", Component: InvoiceTemplateTab },
] as const;

async function checkPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin-orders?stats=1", { headers: { "x-admin-password": password } });
  if (res.ok) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: false, error: data.error ?? "Incorrect password" };
}

function Login({ onSignedIn }: { onSignedIn: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { ok, error: err } = await checkPassword(password);
    setLoading(false);
    if (!ok) {
      setError(err ?? "Incorrect password");
      return;
    }
    storePassword(password);
    onSignedIn(password);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/40 px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border bg-card p-8 shadow-xl">
        <h1 className="font-serif text-2xl">Studio Admin</h1>
        <p className="pt-1 text-sm text-muted-foreground">Enter the admin password to manage your website.</p>
        <input
          type="password"
          required
          autoFocus
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-5 h-12 w-full rounded-xl border bg-background px-4 text-sm"
        />
        {error && <p className="pt-2 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />} Sign In
        </button>
      </form>
    </div>
  );
}

function Dashboard({ password, onSignOut }: { password: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("dashboard");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  const Component = active.Component;

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <h1 className="px-2 pb-4 font-serif text-xl">Studio Admin</h1>
        <nav className="flex-1 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button onClick={onSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          <LogOut className="size-4" /> Sign Out
        </button>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <select value={tab} onChange={(e) => setTab(e.target.value as (typeof TABS)[number]["id"])} className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm">
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button onClick={onSignOut} className="ml-2 rounded-xl border bg-background px-3 py-2 text-sm">
            <LogOut className="size-4" />
          </button>
        </div>
        <main className="p-4 md:p-8">
          <Component password={password} />
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(() => getStoredPassword());
  const [verifying, setVerifying] = useState(!!password);

  // Re-validate a stored password on load, in case it's been changed since the last visit.
  useEffect(() => {
    if (!password) return;
    void checkPassword(password).then(({ ok }) => {
      if (!ok) {
        clearStoredPassword();
        setPassword(null);
        toast.error("Your admin session expired. Please sign in again.");
      }
      setVerifying(false);
    });
  }, [password]);

  if (verifying) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!password) return <Login onSignedIn={setPassword} />;
  return (
    <Dashboard
      password={password}
      onSignOut={() => {
        clearStoredPassword();
        setPassword(null);
      }}
    />
  );
}
