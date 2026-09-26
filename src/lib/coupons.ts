// Discount coupon codes shown/used at checkout. IMPORTANT: also update the matching list in
// api/create-order.ts, since the server (not the browser) decides the final discounted price.
export const COUPONS: Record<string, { percentOff: number }> = {
  WELCOME10: { percentOff: 10 },
  BB15: { percentOff: 15 },
};
