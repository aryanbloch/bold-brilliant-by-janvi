// Shared checkout order type. Ready-to-shop products now come from the live database
// (see src/hooks/use-products.ts) rather than a hardcoded list, so admins can add, edit,
// price and hide products from the admin panel without a code change.
export type CheckoutItem = { name: string; qty: number; price: number; img?: string };

export type CheckoutOrder = {
  items: CheckoutItem[];
  title: string;
  total: number;
  couponCode?: string;
};
