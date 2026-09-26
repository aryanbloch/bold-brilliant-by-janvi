// Real nail art photos used in the auto-scrolling gallery rows on the homepage.
// Replace these Unsplash urls with your own studio photos whenever you like.
const img = (id: string) => `https://images.unsplash.com/photo-${id}?fm=webp&q=70&fit=crop&w=500&h=625`;

export const GALLERY = [
  { name: "Jewelled Gold Stiletto", url: img("1777287216954-2b4b22bb6bf2") },
  { name: "Glitter French Tips", url: img("1772322586754-34c9e6f5be6f") },
  { name: "Blue Ombre Set", url: img("1772322586702-73125782bd99") },
  { name: "Marble Purple Tips", url: img("1772322586785-3a34772cbc61") },
  { name: "Soft Pink Glaze", url: img("1753285310651-6974a839c992") },
  { name: "Bridal Hand & Ring", url: img("1636485830028-1a7663299a1f") },
  { name: "Studio Detailing", url: img("1753285311550-154917dab783") },
  { name: "Mehendi & Bridal Set", url: img("1745540979972-8913a315d48b") },
] as const;
