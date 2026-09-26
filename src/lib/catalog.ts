// Ready-to-shop press-on sets shown in the shop. Edit name/price/image for your real catalogue.
// Set soldOut: true to hide the Buy/Add buttons and show a "Sold Out" badge for a set.
// IMPORTANT: prices are also listed in api/create-order.ts (the server charges from that list),
// so update both places together.
export const READY_SETS = [
  { name: "Nude Glaze Set", price: 599, img: "1610992015762-45dca7fa3a85", soldOut: false },
  { name: "Classic French Set", price: 649, img: "1727199433231-346fd8101839", soldOut: false },
  { name: "Pearl Bloom Set", price: 799, img: "1630843599725-32ead7671867", soldOut: false },
  { name: "Gold Chrome Set", price: 899, img: "1758605456817-5febca1dfeb0", soldOut: false },
  { name: "Rosy Minimal Set", price: 549, img: "1612887390768-fb02affea7a6", soldOut: false },
  { name: "Sparkle Stiletto Set", price: 999, img: "1758605456822-24b5311e100c", soldOut: false },
] as const;

export const setImage = (id: string) => `https://images.unsplash.com/photo-${id}?fm=webp&q=70&fit=crop&w=500&h=625`;

export type CheckoutOrder = {
  items: { name: string; qty: number }[];
  title: string;
  total: number;
  couponCode?: string;
};
