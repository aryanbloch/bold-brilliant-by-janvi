import { Clock, MapPin, Navigation } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { SITE } from "@/lib/site-config.ts";

const FAQS = [
  { q: "Where is the best nail art studio in Rajkot?", a: "Bold & Brilliant by Janvi Sarang is at Astha Chowk, Railnagar, Rajkot - 360001. Girls and women visit us from all over Rajkot and Gujarat for bridal nails, extensions and custom nail art." },
  { q: "How long does a nail art appointment take?", a: "Most sets take 1 to 2 hours. Bridal and detailed 3D designs can take up to 3 hours." },
  { q: "How long will my nail art last?", a: "Gel and extensions usually last 3 to 4 weeks with proper care." },
  { q: "Can I bring my own design reference?", a: "Absolutely. Share a photo while booking and we'll customise it for you." },
  { q: "Do you do bridal nail trials?", a: "Yes, we recommend a trial 1 to 2 weeks before your wedding." },
  { q: "Is the studio hygienic?", a: "All tools are sterilised after every client and we use fresh files and buffers." },
];

export default function FaqContact() {
  return (
    <>
      <section id="faq" className="px-5 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />
          <Reveal>
            <Accordion type="single" collapsible className="rounded-3xl border bg-card px-6">
              {FAQS.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      <section id="contact" className="px-5 pb-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Visit us" title="Find Our Studio" />
          <Reveal>
            <div className="grid gap-6 rounded-[2rem] bg-gradient-to-br from-primary to-[#7a1f4a] p-8 text-primary-foreground shadow-2xl shadow-primary/30 md:grid-cols-2 md:p-12">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="mt-1 size-6 shrink-0" />
                  <div>
                    <h3 className="font-serif text-2xl">Studio Location</h3>
                    <address className="not-italic opacity-85">{SITE.address}</address>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock className="mt-1 size-6 shrink-0" />
                  <div>
                    <h3 className="font-serif text-2xl">Opening Hours</h3>
                    {SITE.hours.map((h) => (
                      <p key={h.day} className="opacity-85">{h.day}: {h.time}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4 md:items-end">
                <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-medium text-[#7a1f4a] transition-transform hover:scale-105">
                  <Navigation className="size-4" /> Open in Google Maps
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
