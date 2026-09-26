// Orders admin tab: search/filter orders, dispatch with courier + tracking number (which starts
// live tracking for both admin and customer), and update status. Backed by api/admin-orders.ts.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, PackageSearch, Search, Truck } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { AdminButton, AdminCard, EmptyRow, FIELD, Spinner } from "./ui.tsx";

type Order = {
  id: string;
  product_name: string;
  amount: number;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  tracking_number: string | null;
  courier: string | null;
  coupon_code: string | null;
  discount: number;
  created_at: string;
  last_tracking_status: string | null;
};

const STATUSES = ["Order placed", "Processing", "Shipped", "Out for delivery", "Delivered", "Cancelled"];
const COURIERS = ["Delhivery", "Shiprocket"];

async function callOrders<T>(password: string, query: string, init?: RequestInit): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(`/api/admin-orders${query}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), "x-admin-password": password, "Content-Type": "application/json" },
  });
  return { ok: res.ok, data: (await res.json()) as T };
}

export default function OrdersTab({ password }: { password: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    void callOrders<{ orders?: Order[]; error?: string }>(password, `?${params.toString()}`).then(({ ok, data }) => {
      if (ok) setOrders(data.orders ?? []);
      else toast.error(data.error ?? "Could not load orders");
    });
  };

  useEffect(load, [password, statusFilter, debouncedSearch]);

  const exportCsv = () => {
    const params = new URLSearchParams({ export: "csv" });
    if (statusFilter) params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    // A GET download can't send a custom header, so pass the password via basic auth in the URL
    // isn't safe either - instead open it in a fetch and save as a blob.
    void fetch(`/api/admin-orders?${params.toString()}`, { headers: { "x-admin-password": password } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not export orders");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Could not export orders"));
  };

  const update = async (order: Order, patch: { status?: string; trackingNumber?: string | null; courier?: string | null }) => {
    setSavingId(order.id);
    const { ok, data } = await callOrders<{ error?: string }>(password, "", { method: "PATCH", body: JSON.stringify({ id: order.id, ...patch }) });
    setSavingId(null);
    if (!ok) {
      toast.error(data.error ?? "Could not update order");
      return;
    }
    toast.success("Order updated");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Orders</h2>
        <AdminButton variant="secondary" onClick={exportCsv}>
          <Download className="size-4" /> Export Excel (CSV)
        </AdminButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${FIELD} pl-9`} placeholder="Search name, phone, tracking..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={`${FIELD} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {orders === null ? (
        <EmptyRow>Loading orders...</EmptyRow>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-12 text-center text-muted-foreground">
          <PackageSearch className="size-10" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} saving={savingId === o.id} onUpdate={update} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, saving, onUpdate }: { order: Order; saving: boolean; onUpdate: (o: Order, patch: { status?: string; trackingNumber?: string | null; courier?: string | null }) => void }) {
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const dirty = status !== order.status || courier !== (order.courier ?? "") || tracking !== (order.tracking_number ?? "");

  return (
    <AdminCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg">{order.product_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.customer_name} · {order.phone} · ₹{order.amount}
            {order.coupon_code && <span className="text-primary"> · {order.coupon_code} (-₹{order.discount})</span>}
          </p>
          <p className="max-w-md whitespace-pre-line pt-1 text-xs text-muted-foreground">{order.address}</p>
          <p className="pt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("en-IN")}</p>
          {order.last_tracking_status && (
            <p className="flex items-center gap-1 pt-1 text-xs text-primary">
              <Truck className="size-3.5" /> {order.last_tracking_status}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${FIELD} w-auto`}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={courier} onChange={(e) => setCourier(e.target.value)} className={`${FIELD} w-auto`}>
            <option value="">Courier...</option>
            {COURIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} className={`${FIELD} w-40`} />
          <AdminButton
            disabled={!dirty || saving}
            onClick={() => onUpdate(order, { status, trackingNumber: tracking || null, courier: courier || null })}
          >
            {saving && <Spinner />} Save
          </AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}
