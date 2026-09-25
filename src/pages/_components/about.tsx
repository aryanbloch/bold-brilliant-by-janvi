import { Brush, Gem, HeartHandshake, ScanEye, ShieldCheck } from "lucide-react";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";

const CARDS = [
  { icon: Brush, title: "Creative Designs", text: "Original artwork, trend-led and hand-painted." },
  { icon: HeartHandshake, title: "Custom Styles", text: "Shapes, shades and details tailored to you." },
  { icon: Gem, title: "Premium Experience", text: "Quality products in a calm, beautiful studio." },
  { icon: ScanEye, title: "Attention to Detail", text: "Clean cuticles, precise lines, lasting finish." },
];

export default function About() {
  return (
    <section id="about" className="bg-gradient-to-b from-background via-secondary/50 to-background px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 pb-14 md:grid-cols-2">
          <Reveal>
            <img src="https://images.unsplash.com/photo-1753285311550-154917dab783?fm=webp&q=70&fit=crop&w=800&h=900" alt="Nail artist painting nail extensions at a nail studio in Rajkot" loading="lazy" width={800} height={900} className="aspect-[8/9] w-full rounded-[2rem] object-cover shadow-2xl shadow-primary/20" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="pb-3 text-xs font-medium uppercase tracking-[0.3em] text-primary">Our story</p>
            <h2 className="font-serif text-4xl font-semibold md:text-5xl">About Our Nail Art</h2>
            <div className="space-y-4 pt-6 text-muted-foreground">
              <p>Bold & Brilliant is Janvi Sarang's nail studio in Rajkot, where nails are treated as wearable art. Each set begins with a conversation about your style, occasion and personality.</p>
              <p>From delicate minimal looks to intricate bridal and 3D designs, we combine creativity with meticulous technique for results that feel uniquely yours.</p>
            </div>
            <p className="flex items-center gap-2 pt-6 text-sm font-medium">
              <ShieldCheck className="size-5 text-primary" /> Sterilised tools & strict hygiene for every client
            </p>
          </Reveal>
        </div>

        <SectionHeading eyebrow="Why choose us" title="Crafted With Intention" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border bg-card/70 p-6 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <c.icon className="size-6" />
                </div>
                <h3 className="pt-5 font-serif text-2xl">{c.title}</h3>
                <p className="pt-2 text-sm text-muted-foreground">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
