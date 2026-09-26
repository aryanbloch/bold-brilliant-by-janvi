import { Star } from "lucide-react";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { REVIEWS } from "@/lib/reviews.ts";

export default function Testimonials() {
  return (
    <section id="reviews" className="bg-gradient-to-b from-background via-secondary/40 to-background px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Reviews" title="Loved By Our Clients" sub="Real feedback from clients across Rajkot and beyond." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-3xl border bg-card/70 p-6 backdrop-blur">
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="size-4" fill={j < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <p className="flex-1 pt-4 text-sm text-muted-foreground">&ldquo;{r.text}&rdquo;</p>
                <div className="pt-4">
                  <p className="font-serif text-lg leading-tight">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.service}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
