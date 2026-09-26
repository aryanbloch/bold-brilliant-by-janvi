// Auto-scrolling nail art showcase: three rows that scroll on their own (no swiping needed),
// row 1 moves right-to-left, row 2 left-to-right, row 3 right-to-left again - matching the
// reference video. Each row's image list is duplicated so the loop is seamless.
import { motion } from "motion/react";
import { SectionHeading } from "@/components/reveal.tsx";
import { GALLERY } from "@/lib/gallery.ts";

type GalleryImage = (typeof GALLERY)[number];

function MarqueeRow({ images, reverse, duration }: { images: GalleryImage[]; reverse: boolean; duration: number }) {
  const loop = [...images, ...images];
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max gap-4"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {loop.map((g, i) => (
          <div key={`${g.name}-${i}`} className="relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl sm:h-52 sm:w-36 md:h-64 md:w-48">
            <img src={g.url} alt={`${g.name} nail art in Rajkot`} loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Gallery() {
  const row1 = GALLERY.slice(0, 3);
  const row2 = GALLERY.slice(3, 6);
  const row3 = [...GALLERY.slice(6, 8), GALLERY[0], GALLERY[1]];

  return (
    <section id="work" className="overflow-hidden px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Our Work" title="Nail Art We've Created" sub="A look at our favourite designs, hand-painted in the studio." />
      </div>
      <div className="flex flex-col gap-4">
        <MarqueeRow images={row1} reverse={false} duration={22} />
        <MarqueeRow images={row2} reverse={true} duration={26} />
        <MarqueeRow images={row3} reverse={false} duration={24} />
      </div>
    </section>
  );
}
