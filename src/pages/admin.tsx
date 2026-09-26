// Simple password-gated admin page for the studio owner to manage orders without opening
// Supabase. Visit /admin, enter the admin password (set as ADMIN_PASSWORD in Vercel), then
// update order status and tracking numbers - customers see the change instantly in My Orders.
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LogOut, PackageSearch, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  product_name: string;
  amount: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  tracking_number: string | null;
  created_at: string;
};

const STATUSES = ["Order placed", "Processing", "Shipped", "Out for delivery", "Delivered", "Cancelled"] as const;
const STORAGE_KEY = "bb-admin-password";

async function callAdmin<T>(password: string, init?: RequestInit): Promise<{ ok: boolean; data: T }> {
  const res = await fetch("/api/admin-orders", {
    ...init,
    headers: { ...(init?.headers ?? {}), "x-admin-password": password, "Content-Type": "application/json" },
  });
  return { ok: res.ok, data: (await res.json()) as T };
}

function Login({ onSignedIn }: { onSignedIn: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { ok, data } = await callAdmin<{ error?: string }>(password);
    setLoading(false);
    if (!ok) {
      setError(data.error ?? "Incorrect password");
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, password);
    onSignedIn(password);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/40 px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border bg-card p-8 shadow-xl">
        <h1 className="font-serif text-2xl">Studio Admin</h1>
        <p className="pt-1 text-sm text-muted-foreground">Enter the admin password to manage orders.</p>
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

function OrderRow({ order, saving, onSave }: { order: Order; saving: boolean; onSave: (order: Order, status: string, trackingNumber: string) => void }) {
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const dirty = status !== order.status || tracking !== (order.tracking_number ?? "");

  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg">{order.product_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.customer_name} · {order.phone} · \u20b9{order.amount}
          </p>
          <p className="max-w-md whitespace-pre-line pt-1 text-xs text-muted-foreground">{order.address}</p>
          <p className="pt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm">
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            placeholder="Tracking number"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="h-10 w-40 rounded-xl border bg-background px-3 text-sm"
          />
          <button
            disabled={!dirty || saving}
            onClick={() => onSave(order, status, tracking)}
            className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ password, onSignOut }: { password: string; onSignOut: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { ok, data } = await callAdmin<{ orders?: Order[]; error?: string }>(password);
    setLoading(false);
    if (!ok) {
      toast.error(data.error ?? "Could not load orders");
      if (data.error?.toLowerCase().includes("password")) onSignOut();
      return;
    }
    setOrders(data.orders ?? []);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (order: Order, status: string, trackingNumber: string) => {
    setSavingId(order.id);
    const { ok, data } = await callAdmin<{ error?: string }>(password, {
      method: "PATCH",
      body: JSON.stringify({ id: order.id, status, trackingNumber: trackingNumber || null }),
    });
    setSavingId(null);
    if (!ok) {
      toast.error(data.error ?? "Could not save changes");
      return;
    }
    toast.success("Order updated");
    setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, status, tracking_number: trackingNumber || null } : o)) ?? null);
  };

  return (
    <div className="min-h-screen bg-secondary/30 px-5 py-8 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
          <h1 className="font-serif text-3xl">Orders</h1>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              <RefreshCw className="size-4" /> Refresh
            </button>
            <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              <LogOut className="size-4" /> Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-12 text-center text-muted-foreground">
            <PackageSearch className="size-10" />
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} saving={savingId === o.id} onSave={save} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));

  if (!password) return <Login onSignedIn={setPassword} />;
  return (
    <Dashboard
      password={password}
      onSignOut={() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setPassword(null);
      }}
    />
  );
}
