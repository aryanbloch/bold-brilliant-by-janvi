// Fetches live shipment status + city-by-city movement from the courier for one order, caches
// it on the order (shipment_events, last_tracking_*) and auto-marks the order "Delivered" the
// moment the courier confirms delivery. Tries Delhivery first, then Shiprocket.
// Called from the browser (My Orders / admin) with ?orderId=... - no tokens needed since it
// only ever reads the order's own stored tracking number and courier.
// Env vars (Vercel): DELHIVERY_API_TOKEN, SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD,
// SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL (falls back to VITE_SUPABASE_URL).
import { dbFetch, getEnv, q, type ApiRequest, type ApiResponse } from "./_lib/db.js";

type TrackingEvent = { status: string; location: string; date: string };
type TrackingResult = { courier: string; currentStatus: string; currentLocation: string; events: TrackingEvent[]; delivered: boolean };

// In-memory cache for the Shiprocket auth token (short lived per serverless instance - fine
// since it just saves an extra login call on warm invocations, and re-logs in on cold ones).
let shiprocketToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;
  if (shiprocketToken && shiprocketToken.expiresAt > Date.now()) return shiprocketToken.token;

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  if (!data.token) return null;
  shiprocketToken = { token: data.token, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 9 };
  return data.token;
}

const isDelivered = (status: string) => /deliver/i.test(status) && !/out for deliver/i.test(status);

async function trackWithDelhivery(trackingNumber: string): Promise<TrackingResult | null> {
  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return null;

  const res = await fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${encodeURIComponent(trackingNumber)}&token=${token}`);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    ShipmentData?: { Shipment?: { Status?: { Status?: string; StatusLocation?: string; StatusDateTime?: string }; Scans?: { ScanDetail: { Scan?: string; ScannedLocation?: string; StatusDateTime?: string } }[] } }[];
  };
  const shipment = data.ShipmentData?.[0]?.Shipment;
  if (!shipment?.Status) return null;

  const events: TrackingEvent[] = (shipment.Scans ?? [])
    .map((s) => ({ status: s.ScanDetail?.Scan ?? "Update", location: s.ScanDetail?.ScannedLocation ?? "", date: s.ScanDetail?.StatusDateTime ?? "" }))
    .reverse();
  const currentStatus = shipment.Status.Status ?? "In Transit";

  return { courier: "Delhivery", currentStatus, currentLocation: shipment.Status.StatusLocation ?? "", events, delivered: isDelivered(currentStatus) };
}

async function trackWithShiprocket(trackingNumber: string): Promise<TrackingResult | null> {
  const token = await getShiprocketToken();
  if (!token) return null;

  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(trackingNumber)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    tracking_data?: {
      track_status?: number;
      shipment_track?: { current_status?: string; current_location?: string }[];
      shipment_track_activities?: { status?: string; location?: string; date?: string }[];
    };
  };
  const track = data.tracking_data;
  if (!track || track.track_status === undefined) return null;

  const events: TrackingEvent[] = (track.shipment_track_activities ?? []).map((a) => ({ status: a.status ?? "Update", location: a.location ?? "", date: a.date ?? "" }));
  const currentStatus = track.shipment_track?.[0]?.current_status ?? "In Transit";

  return { courier: "Shiprocket", currentStatus, currentLocation: track.shipment_track?.[0]?.current_location ?? "", events, delivered: isDelivered(currentStatus) };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const orderId = q(req, "orderId");
  const directTrackingNumber = q(req, "trackingNumber");
  if (!orderId && !directTrackingNumber) {
    res.status(400).json({ error: "Missing orderId or trackingNumber" });
    return;
  }

  const env = getEnv();
  let trackingNumber = directTrackingNumber ?? null;

  try {
    if (orderId && env) {
      const r = await dbFetch(env.supabaseUrl, env.serviceKey, `orders?id=eq.${encodeURIComponent(orderId)}&select=tracking_number,status`);
      const rows = (await r.json()) as { tracking_number: string | null; status: string }[];
      trackingNumber = rows[0]?.tracking_number ?? null;
    }
    if (!trackingNumber) {
      res.status(404).json({ error: "This order has not been dispatched yet." });
      return;
    }

    const result = (await trackWithDelhivery(trackingNumber)) ?? (await trackWithShiprocket(trackingNumber));
    if (!result) {
      res.status(404).json({ error: "Tracking info not available yet. Please check back soon." });
      return;
    }

    // Cache the latest status on the order + upsert the event history, and auto-mark delivered.
    if (orderId && env) {
      const nowIso = new Date().toISOString();
      const patch: Record<string, unknown> = {
        last_tracking_status: result.currentStatus,
        last_tracking_location: result.currentLocation,
        last_tracking_sync_at: nowIso,
      };
      if (result.delivered) {
        patch.status = "Delivered";
        patch.delivered_at = nowIso;
      }
      await dbFetch(env.supabaseUrl, env.serviceKey, `orders?id=eq.${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      });

      for (const e of result.events.slice(0, 20)) {
        if (!e.date) continue;
        await dbFetch(env.supabaseUrl, env.serviceKey, "shipment_events", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ order_id: orderId, status: e.status, location: e.location, event_time: e.date, source: "courier" }),
        });
      }
    }

    res.status(200).json({ courier: result.courier, currentStatus: result.currentStatus, currentLocation: result.currentLocation, events: result.events });
  } catch {
    res.status(502).json({ error: "Could not fetch tracking info right now. Please try again later." });
  }
}
