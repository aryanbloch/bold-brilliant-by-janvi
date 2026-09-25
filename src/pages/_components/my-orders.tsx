// Shows the customer's own past orders, their status, and live courier shipment journey - no typing needed.
// Reads orders directly from Supabase (RLS-protected), then fetches live tracking from /api/track-shipment
// which auto-detects whether the courier is Delhivery or Shiprocket.
import { useEffect, useState } from "react";
import { LogIn, PackageSearch, Truck } from "lucide-react";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import SignInDialog from "./sign-in-dialog.tsx";
import ShipmentJourney from "./shipment-journey.tsx";

type Order = {
  id: string;
  product_name: string;
  amount: number;
  status: string;
  tracking_number: string | null;
  created_at: string;
};

export default function MyOrders() {
  const { user, isSignedIn, loading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (!supabase || !user) {
      setOrders(null);
      return;
    }
    supabase
      .from("orders")
      .select("id, product_name, amount, status, tracking_number, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Order[] | null) ?? []));
  }, [user]);

  if (!isSupabaseConfigured) return null;

  return (
    <section id="my-orders" className="px-5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="My Account" title="My Orders" sub="See your order status and live delivery journey here, automatically." />

        <Reveal>
          {loading ? (
            <Skeleton className="h-32 w-full rounded-3xl" />
          ) : !isSignedIn ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LogIn />
                </EmptyMedia>
                <EmptyTitle>Sign in to see your orders</EmptyTitle>
                <EmptyDescription>Sign in with the email you used while ordering to see your order status here.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <button onClick={() => setShowSignIn(true)} className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105">
                  Sign In
                </button>
              </EmptyContent>
            </Empty>
          ) : orders === null ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-3xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageSearch />
                </EmptyMedia>
                <EmptyTitle>No orders yet</EmptyTitle>
                <EmptyDescription>Once you place an order, it will show up here with live delivery status.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="flex flex-col gap-3 rounded-3xl border bg-card/70 p-5 backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-serif text-lg">{o.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{o.amount} · {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                      <Truck className="size-4" /> {o.status}
                    </div>
                  </div>
                  {o.tracking_number && <ShipmentJourney trackingNumber={o.tracking_number} />}
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <SignInDialog open={showSignIn} onClose={() => setShowSignIn(false)} />
    </section>
  );
}
