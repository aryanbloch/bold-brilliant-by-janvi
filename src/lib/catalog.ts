// Ready-to-shop press-on sets shown in the shop. Edit name/price/image for your real catalogue.
// IMPORTANT: prices are also listed in api/create-order.ts (the server charges from that list),
// so update both places together.
export const READY_SETS = [
  { name: "Nude Glaze Set", price: 599, img: "1610992015762-45dca7fa3a85" },
  { name: "Classic French Set", price: 649, img: "1727199433231-346fd8101839" },
  { name: "Pearl Bloom Set", price: 799, img: "1630843599725-32ead7671867" },
  { name: "Gold Chrome Set", price: 899, img: "1758605456817-5febca1dfeb0" },
  { name: "Rosy Minimal Set", price: 549, img: "1612887390768-fb02affea7a6" },
  { name: "Sparkle Stiletto Set", price: 999, img: "1758605456822-24b5311e100c" },
] as const;

export const setImage = (id: string) => `https://images.unsplash.com/photo-${id}?fm=webp&q=70&fit=crop&w=500&h=625`;

export type CheckoutOrder = {
  items: { name: string; qty: number }[];
  title: string;
  total: number;
};
