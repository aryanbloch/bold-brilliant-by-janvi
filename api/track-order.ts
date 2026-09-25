// Looks up a shipment's live status by trying Shiprocket first, then Delhivery.
// The customer only enters a tracking number - which courier it belongs to is detected automatically.
// Configure these as environment variables in the Vercel project once you have the accounts:
//   SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD  (Shiprocket API login)
//   DELHIVERY_API_TOKEN                    (Delhivery API token)

interface ApiRequest {
  method?: string;
  body?: unknown;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

type Checkpoint = { status: string; date: string; location?: string };
type TrackResult = { found: boolean; courier?: "Shiprocket" | "Delhivery"; status?: string; checkpoints?: Checkpoint[] };

async function trackShiprocket(awb: string): Promise<TrackResult | null> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;

  try {
    const loginRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = (await loginRes.json()) as { token?: string };
    if (!loginRes.ok || !loginData.token) return null;

    const trackRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awb)}`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    if (!trackRes.ok) return null;
    const trackData = (await trackRes.json()) as {
      tracking_data?: {
        track_status?: number;
        shipment_track?: { current_status?: string }[];
        shipment_track_activities?: { date: string; status: string; location?: string }[];
      };
    };
    const info = trackData.tracking_data;
    if (!info || (info.track_status === 0 && !info.shipment_track_activities?.length)) return null;

    const checkpoints: Checkpoint[] = (info.shipment_track_activities ?? []).map((a) => ({
      status: a.status,
      date: a.date,
      location: a.location,
    }));

    return {
      found: true,
      courier: "Shiprocket",
      status: info.shipment_track?.[0]?.current_status ?? checkpoints[0]?.status ?? "In transit",
      checkpoints,
    };
  } catch {
    return null;
  }
}

async function trackDelhivery(awb: string): Promise<TrackResult | null> {
  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}&token=${token}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ShipmentData?: { Shipment?: { Status?: { Status?: string }; Scans?: { ScanDetail: { ScanDateTime: string; Scan: string; ScannedLocation?: string } }[] } }[];
    };
    const shipment = data.ShipmentData?.[0]?.Shipment;
    if (!shipment) return null;

    const checkpoints: Checkpoint[] = (shipment.Scans ?? [])
      .map((s) => ({ status: s.ScanDetail.Scan, date: s.ScanDetail.ScanDateTime, location: s.ScanDetail.ScannedLocation }))
      .reverse();

    return {
      found: true,
      courier: "Delhivery",
      status: shipment.Status?.Status ?? checkpoints[0]?.status ?? "In transit",
      checkpoints,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = (req.body ?? {}) as { trackingNumber?: string };
  const trackingNumber = body.trackingNumber?.trim();

  if (!trackingNumber) {
    res.status(400).json({ error: "Please enter a tracking number" });
    return;
  }

  if (!process.env.SHIPROCKET_EMAIL && !process.env.DELHIVERY_API_TOKEN) {
    res.status(200).json({
      found: false,
      error: "Order tracking is being set up. Please message us on WhatsApp with your tracking number for the latest update.",
    });
    return;
  }

  const shiprocketResult = await trackShiprocket(trackingNumber);
  if (shiprocketResult) {
    res.status(200).json(shiprocketResult);
    return;
  }

  const delhiveryResult = await trackDelhivery(trackingNumber);
  if (delhiveryResult) {
    res.status(200).json(delhiveryResult);
    return;
  }

  res.status(200).json({
    found: false,
    error: "We couldn't find this tracking number. Please double check it, or message us on WhatsApp for help.",
  });
}
