// Verifies the Razorpay payment signature on the server. Never trust a "payment successful"
// message from the browser alone - this check confirms Razorpay actually signed it.
import { createHmac } from "node:crypto";

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

  const body = (req.body ?? {}) as { orderId?: string; paymentId?: string; signature?: string };
  const { orderId, paymentId, signature } = body;

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ error: "Missing payment details" });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: "Payment gateway is not configured yet." });
    return;
  }

  const expectedSignature = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");

  if (expectedSignature !== signature) {
    res.status(400).json({ error: "Payment could not be verified", verified: false });
    return;
  }

  res.status(200).json({ verified: true });
}
