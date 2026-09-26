import Reveal from "@/components/reveal.tsx";
import { SITE } from "@/lib/site-config.ts";

export default function Founder() {
  return (
    <section id="founder" className="px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal className="order-1 md:order-2">
            <img
              src={SITE.founderPhoto}
              alt="Janvi Sarang, founder and nail artist, at the Bold & Brilliant studio in Rajkot"
              loading="lazy"
              width={534}
              height={720}
              className="mx-auto aspect-[3/4] w-full max-w-md rounded-[2rem] object-cover object-top shadow-2xl shadow-primary/20"
            />
          </Reveal>
          <Reveal delay={0.1} className="order-2 md:order-1">
            <p className="pb-3 text-xs font-medium uppercase tracking-[0.3em] text-primary">Meet Janvi</p>
            <h2 className="font-serif text-4xl font-semibold md:text-5xl">
              Hi, I&apos;m Janvi — the artist behind Bold & Brilliant. ✨
            </h2>
            <div className="space-y-4 pt-6 text-muted-foreground">
              <p>
                What started as a love for nail art grew into a space where I can turn creative ideas
                into personalised nail sets, crafted with patience, precision and lots of love.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
