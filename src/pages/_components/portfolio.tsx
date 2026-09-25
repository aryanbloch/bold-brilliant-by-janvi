import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { SectionHeading } from "@/components/reveal.tsx";
import { cn } from "@/lib/utils.ts";

const img = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?fm=webp&q=70&fit=crop&w=${w}&h=${Math.round(w * 1.25)}`;

const CATEGORIES = ["All", "Trending", "Bridal", "French", "3D Nail Art", "Luxury", "Minimal", "Custom Designs"] as const;
type Category = (typeof CATEGORIES)[number];

// Placeholder portfolio. Swap image ids/urls with your own work later.
const DESIGNS: { name: string; category: Exclude<Category, "All">; id: string }[] = [
  { name: "Blush Pink Glaze", category: "Trending", id: "1604902396830-aca29e19b067" },
  { name: "Jewelled Gold Stiletto", category: "Luxury", id: "1777287216954-2b4b22bb6bf2" },
  { name: "Sweetheart Hearts", category: "Custom Designs", id: "1754799670410-b282791342c3" },
  { name: "Ivory Bridal Lace", category: "Bridal", id: "1581296679262-bb96b7b7bb47" },
  { name: "Soft Matte Square", category: "Minimal", id: "1772322586649-fc11154e76b9" },
  { name: "Silver Filigree", category: "3D Nail Art", id: "1773808605530-17926a0463e9" },
  { name: "Classic Nude French", category: "French", id: "1727199433231-346fd8101839" },
  { name: "Leopard & Leaf", category: "Trending", id: "1777288390469-828f8816231c" },
  { name: "Noir Stiletto", category: "Luxury", id: "1777287216958-84144739db83" },
  { name: "Ornate Couture", category: "3D Nail Art", id: "1780402695869-49cfb47f9f9b" },
  { name: "Pearl & Rings", category: "Bridal", id: "1754799670380-17640d939e32" },
  { name: "Muted Rose French", category: "French", id: "1587729927031-830c32f520da" },
];

export default function Portfolio() {
  const [cat, setCat] = useState<Category>("All");
  const [active, setActive] = useState<(typeof DESIGNS)[number] | null>(null);
  const list = cat === "All" ? DESIGNS : DESIGNS.filter((d) => d.category === cat);

  return (
    <section id="portfolio" className="px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Portfolio" title="Explore Our Nail Art" sub="Every set is designed around you, from quiet minimal to show-stopping couture." />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-6 md:pb-10 md:flex-wrap md:justify-center">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-5 py-2 text-sm transition-all", cat === c ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-card hover:border-primary/50")}>
              {c}
            </button>
          ))}
        </div>
        <motion.div layout className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((d) => (
              <motion.button layout key={d.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.35 }} onClick={() => setActive(d)} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted text-left">
                <img src={img(d.id, 500)} alt={`${d.name} - ${d.category} nail art design in Rajkot`} loading="lazy" decoding="async" width={500} height={625} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white transition-transform duration-500 md:translate-y-2 md:group-hover:translate-y-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-pink-200">{d.category}</p>
                  <p className="font-serif text-lg leading-tight md:text-xl">{d.name}</p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg overflow-hidden border-0 p-0 sm:max-w-xl">
          {active && (
            <>
              <img src={img(active.id, 1000)} alt={`${active.name} nail art`} className="aspect-[4/5] w-full object-cover" />
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-primary">{active.category}</p>
                <DialogTitle className="font-serif text-2xl">{active.name}</DialogTitle>
                <a href="#booking" onClick={() => setActive(null)} className="inline-block pt-3 text-sm font-medium text-primary underline-offset-4 hover:underline">Book this design</a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
