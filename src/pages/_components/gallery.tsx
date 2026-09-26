import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import Carousel from "@/components/carousel.tsx";
import { GALLERY } from "@/lib/gallery.ts";

export default function Gallery() {
  return (
    <section id="gallery" className="px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Gallery" title="Nail Art We've Created" sub="Swipe through our favourite designs, hand-painted in the studio." />
        <Reveal>
          <Carousel itemClassName="w-[72%] sm:w-[42%] lg:w-[27%]">
            {GALLERY.map((g) => (
              <div key={g.name} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
                <img src={g.url} alt={`${g.name} - ${g.category} nail art in Rajkot`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-pink-200">{g.category}</p>
                  <p className="font-serif text-lg leading-tight">{g.name}</p>
                </div>
              </div>
            ))}
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}
