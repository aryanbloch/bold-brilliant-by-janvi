// Shows the live courier journey (Shipped -> reached City X -> Out for Delivery -> Delivered)
// for one order, fetched automatically from /api/track-shipment using the order id. No tracking
// number typing needed - and every fetch also refreshes the order's cached status, auto-marking
// it "Delivered" the moment the courier confirms delivery.
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type TrackingEvent = { status: string; location: string; date: string };
type TrackingResult = { courier: string; currentStatus: string; currentLocation: string; events: TrackingEvent[] };

export default function ShipmentJourney({ orderId }: { orderId: string }) {
  const [state, setState] = useState<{ loading: boolean; data: TrackingResult | null; error: string | null }>({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });
    fetch(`/api/track-shipment?orderId=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        const body = (await res.json()) as TrackingResult & { error?: string };
        if (!active) return;
        if (!res.ok) {
          setState({ loading: false, data: null, error: body.error ?? "Tracking info not available yet." });
          return;
        }
        setState({ loading: false, data: body, error: null });
      })
      .catch(() => {
        if (active) setState({ loading: false, data: null, error: "Could not fetch tracking info right now." });
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (state.loading) return <Skeleton className="h-20 w-full rounded-2xl" />;

  if (state.error || !state.data) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="size-4 shrink-0" /> {state.error ?? "Tracking info not available yet."}
      </div>
    );
  }

  const { courier, currentStatus, currentLocation, events } = state.data;

  return (
    <div className="rounded-2xl border bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="size-4 text-primary" />
          {currentStatus}
          {currentLocation && <span className="text-muted-foreground">· {currentLocation}</span>}
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Via {courier}</span>
      </div>

      {events.length > 0 && (
        <ol className="space-y-3 border-l border-dashed pl-4">
          {events.slice(0, 6).map((e, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[21px] top-0.5 grid size-3.5 place-items-center rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`}>
                {i === 0 && <CheckCircle2 className="size-3.5 text-primary-foreground" />}
              </span>
              <p className="text-sm font-medium">{e.status}</p>
              <p className="text-xs text-muted-foreground">
                {e.location} {e.date && `· ${e.date}`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
