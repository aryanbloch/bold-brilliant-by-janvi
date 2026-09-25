// Fetches live shipment status + city-by-city movement from the courier, given a tracking number.
// Tries Delhivery first, then Shiprocket, since either courier could have shipped the order.
// Env vars needed (set in Vercel): DELHIVERY_API_TOKEN, SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD.
interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

type TrackingEvent = { status: string; location: string; date: string };
type TrackingResult = { courier: string; currentStatus: string; currentLocation: string; events: TrackingEvent[] };

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
    .map((s) => ({
      status: s.ScanDetail?.Scan ?? "Update",
      location: s.ScanDetail?.ScannedLocation ?? "",
      date: s.ScanDetail?.StatusDateTime ?? "",
    }))
    .reverse();

  return {
    courier: "Delhivery",
    currentStatus: shipment.Status.Status ?? "In Transit",
    currentLocation: shipment.Status.StatusLocation ?? "",
    events,
  };
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

  const events: TrackingEvent[] = (track.shipment_track_activities ?? []).map((a) => ({
    status: a.status ?? "Update",
    location: a.location ?? "",
    date: a.date ?? "",
  }));

  return {
    courier: "Shiprocket",
    currentStatus: track.shipment_track?.[0]?.current_status ?? "In Transit",
    currentLocation: track.shipment_track?.[0]?.current_location ?? "",
    events,
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const trackingNumber = req.query?.trackingNumber;
  const awb = Array.isArray(trackingNumber) ? trackingNumber[0] : trackingNumber;
  if (!awb) {
    res.status(400).json({ error: "Missing tracking number" });
    return;
  }

  try {
    const result = (await trackWithDelhivery(awb)) ?? (await trackWithShiprocket(awb));
    if (!result) {
      res.status(404).json({ error: "Tracking info not available yet. Please check back soon." });
      return;
    }
    res.status(200).json(result);
  } catch {
    res.status(502).json({ error: "Could not fetch tracking info right now. Please try again later." });
  }
}
