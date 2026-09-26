import { ClipboardList, HandHeart, Ruler, ShoppingBag, SprayCan } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";

const GUIDES = [
  {
    icon: Ruler,
    q: "Size Guide",
    a: "Every set is made to fit your nails perfectly. After you order, we'll send you a simple size chart photo - just measure your natural nail widths and match them to the closest size (XS to XL) for each finger. If you're not sure, our team will guide you on WhatsApp with easy tips to get the right fit.",
  },
  {
    icon: ShoppingBag,
    q: "How to Order",
    a: "1. Browse our ready-to-shop sets or tell us your custom design idea.\n2. Message us on WhatsApp with the set name or your reference photos.\n3. Share your nail sizes (we'll help you measure) and delivery address.\n4. Confirm payment and we'll pack and ship your set with free delivery all over India.",
  },
  {
    icon: HandHeart,
    q: "Application",
    a: "1. Push back cuticles and lightly buff the nail surface.\n2. Clean nails with the alcohol wipe provided to remove oils.\n3. Match each press-on to the correct finger using the size guide.\n4. Apply the adhesive tab or nail glue included in your kit and press down firmly for 20-30 seconds.\n5. Avoid water contact for the first hour for the strongest hold.",
  },
  {
    icon: SprayCan,
    q: "Removal & Care",
    a: "Soak nails in warm water with a little cuticle oil or soap for 10-15 minutes to loosen the bond, then gently lift from the edges - never force or pry them off. Avoid using nails as tools, wear gloves while cleaning, and apply cuticle oil daily to keep both your natural nails and the set looking fresh. Store unused sets flat in their box, away from direct heat.",
  },
];

export default function OrderGuide() {
  return (
    <section id="guide" className="bg-gradient-to-b from-background via-secondary/40 to-background px-5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Good to know" title="Size Guide, Ordering & Care" sub="Everything you need to know before and after your set arrives." />
        <Reveal>
          <Accordion type="single" collapsible className="rounded-3xl border bg-card px-6">
            {GUIDES.map((g) => (
              <AccordionItem key={g.q} value={g.q}>
                <AccordionTrigger className="text-left text-base">
                  <span className="flex items-center gap-3">
                    <g.icon className="size-5 shrink-0 text-primary" />
                    {g.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-muted-foreground">{g.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
        <Reveal delay={0.1}>
          {/* Icon sits inline with the text so it stays right before "Still" even when the line wraps. */}
          <p className="pt-6 text-center text-sm text-muted-foreground">
            <ClipboardList className="mr-1.5 inline size-4 align-[-3px] text-primary" />
            Still have questions? Check our FAQ below or message us on WhatsApp.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
