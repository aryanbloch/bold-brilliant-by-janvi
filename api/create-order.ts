// Creates a Razorpay order on the server so the amount cannot be tampered with from the browser.
// Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set as environment variables in the Vercel project.

interface ApiRequest {
  method?: string;
  body?: unknown;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = (req.body ?? {}) as { amount?: number; name?: string };
  const { amount, name } = body;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(500).json({ error: "Payment gateway is not configured yet. Please contact the studio." });
    return;
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency: "INR",
        notes: { product: name ?? "Nail set order" },
      }),
    });
    const data = (await response.json()) as { id?: string; amount?: number; currency?: string; error?: { description?: string } };

    if (!response.ok || !data.id) {
      res.status(502).json({ error: data.error?.description ?? "Could not start payment. Please try again." });
      return;
    }

    res.status(200).json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch {
    res.status(500).json({ error: "Something went wrong while starting your payment." });
  }
}
