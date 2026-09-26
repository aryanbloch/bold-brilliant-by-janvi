// Real nail art photos, swipeable left-right (touch swipe on mobile, arrows on desktop).
// Replace these Unsplash urls with your own studio photos whenever you like.
const img = (id: string) => `https://images.unsplash.com/photo-${id}?fm=webp&q=70&fit=crop&w=700&h=875`;

export const GALLERY = [
  { name: "Jewelled Gold Stiletto", category: "Luxury", url: img("1777287216954-2b4b22bb6bf2") },
  { name: "Glitter French Tips", category: "French", url: img("1772322586754-34c9e6f5be6f") },
  { name: "Blue Ombre Set", category: "Trending", url: img("1772322586702-73125782bd99") },
  { name: "Marble Purple Tips", category: "3D Nail Art", url: img("1772322586785-3a34772cbc61") },
  { name: "Soft Pink Glaze", category: "Minimal", url: img("1753285310651-6974a839c992") },
  { name: "Bridal Hand & Ring", category: "Bridal", url: img("1636485830028-1a7663299a1f") },
  { name: "Studio Detailing", category: "Custom Designs", url: img("1753285311550-154917dab783") },
  { name: "Mehendi & Bridal Set", category: "Bridal", url: img("1745540979972-8913a315d48b") },
] as const;
