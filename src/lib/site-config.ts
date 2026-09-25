// Edit this one file to update brand details, contacts and media paths.
export const SITE = {
  brand: "Bold & Brilliant",
  byline: "by Janvi Sarang",
  // Replace with the real number incl. country code, digits only (e.g. "919876543210")
  whatsappNumber: "YOUR_WHATSAPP_NUMBER",
  instagramUser: "bold.brilliant.byjanvi",
  instagramUrl: "https://www.instagram.com/bold.brilliant.byjanvi",
  mapsUrl: "https://maps.app.goo.gl/jpdYwRzNMrp4Sxzm8",
  address: "Astha Chowk, Railnagar, Rajkot - 360001",
  hours: [
    { day: "Mon - Sat", time: "10:00 AM - 8:00 PM" },
    { day: "Sunday", time: "By appointment" },
  ],
  videos: {
    hero: "/videos/nail-video-1.mp4",
    showcase: "/videos/nail-video-2.mp4",
  },
  poster:
    "https://images.unsplash.com/photo-1604902396830-aca29e19b067?fm=webp&q=60&w=800",
  delivery: "Free delivery all over India",
} as const;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${SITE.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const NAV = [
  { label: "Shop", href: "#shop" },
  { label: "About", href: "#about" },
  { label: "Book", href: "#booking" },
  { label: "My Orders", href: "#my-orders" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
] as const;
