// Admin dashboard tab: today's sales, total orders, and how many parcels are pending dispatch.
// Backed by api/admin-orders.ts?stats=1.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { AdminCard } from "./ui.tsx";

type Stats = { totalOrders: number; ordersToday: number; pendingDispatch: number; salesToday: number };

export default function DashboardTab({ password }: { password: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetch("/api/admin-orders?stats=1", { headers: { "x-admin-password": password } })
      .then(async (res) => {
        const data = (await res.json()) as Stats & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Could not load dashboard");
        setStats(data);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load dashboard"));
  }, [password]);

  const cards = [
    { label: "Sales Today", value: stats ? `₹${stats.salesToday}` : "...", icon: IndianRupee, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "Orders Today", value: stats?.ordersToday ?? "...", icon: ShoppingBag, color: "text-primary bg-primary/10" },
    { label: "Total Orders", value: stats?.totalOrders ?? "...", icon: PackageCheck, color: "text-blue-600 bg-blue-500/10" },
    { label: "Pending Dispatch", value: stats?.pendingDispatch ?? "...", icon: Truck, color: "text-amber-600 bg-amber-500/10" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <AdminCard key={c.label} className="flex items-center gap-4">
            <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${c.color}`}>
              <c.icon className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </AdminCard>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Go to the Orders tab to search, filter, dispatch, and export orders to Excel.</p>
    </div>
  );
}
