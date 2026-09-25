import { useState } from "react";
import { Sparkles, Truck } from "lucide-react";
import { WhatsappLogo } from "@phosphor-icons/react";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { whatsappLink } from "@/lib/site-config.ts";
import CheckoutDialog from "./checkout-dialog.tsx";

// Ready-to-shop press-on sets. Edit name/price/image for your real catalogue.
const READY_SETS = [
  { name: "Nude Glaze Set", price: 599, img: "1610992015762-45dca7fa3a85" },
  { name: "Classic French Set", price: 649, img: "1727199433231-346fd8101839" },
  { name: "Pearl Bloom Set", price: 799, img: "1630843599725-32ead7671867" },
  { name: "Gold Chrome Set", price: 899, img: "1758605456817-5febca1dfeb0" },
  { name: "Rosy Minimal Set", price: 549, img: "1612887390768-fb02affea7a6" },
  { name: "Sparkle Stiletto Set", price: 999, img: "1758605456822-24b5311e100c" },
];

const CUSTOM_SETS = [
  { name: "Custom Everyday Set", price: "Starts at ₹699", desc: "Your choice of shape, length and 1-2 colours." },
  { name: "Custom 3D / Charm Set", price: "Starts at ₹1,299", desc: "Hand-placed charms, chrome, or 3D detailing." },
  { name: "Custom Bridal Set", price: "Starts at ₹1,999", desc: "Fully personalised bridal design with trial option." },
];

const img = (id: string) => `https://images.unsplash.com/photo-${id}?fm=webp&q=70&fit=crop&w=500&h=625`;

export default function Shop() {
  const [tab, setTab] = useState<"ready" | "custom">("ready");
  const [checkoutProduct, setCheckoutProduct] = useState<{ name: string; price: number } | null>(null);

  const orderCustom = (name: string) => {
    const text = `Hello! I'm interested in the ${name}. Could you help me with the design and pricing?`;
    window.open(whatsappLink(text), "_blank", "noopener");
  };

  return (
    <section id="shop" className="px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Shop" title="Ready-to-Shop & Custom Nail Sets" sub="Reusable press-on nail sets, hand-painted in our Rajkot studio and shipped to your door." />

        <Reveal>
          <div className="mx-auto mb-10 flex w-fit items-center gap-2 rounded-full border bg-card p-1.5">
            <button onClick={() => setTab("ready")} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === "ready" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              Ready-to-Shop Sets
            </button>
            <button onClick={() => setTab("custom")} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === "custom" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              Custom Sets
            </button>
          </div>
        </Reveal>

        {tab === "ready" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
            {READY_SETS.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.06}>
                <div className="group overflow-hidden rounded-3xl border bg-card/70 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10">
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img src={img(s.img)} alt={`${s.name} press-on nail set`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-lg leading-tight">{s.name}</h3>
                    <p className="pt-1 text-sm font-medium text-primary">₹{s.price}</p>
                    <button onClick={() => setCheckoutProduct({ name: s.name, price: s.price })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]">
                      Buy Now
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            {CUSTOM_SETS.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-3xl border bg-card/70 p-6 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="pt-5 font-serif text-2xl">{s.name}</h3>
                  <p className="pt-1 text-sm font-medium text-primary">{s.price}</p>
                  <p className="flex-1 pt-2 text-sm text-muted-foreground">{s.desc}</p>
                  <button onClick={() => orderCustom(s.name)} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02]">
                    <WhatsappLogo size={16} weight="fill" /> Enquire on WhatsApp
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-4 text-center sm:flex-row sm:justify-center">
            <Truck className="size-5 text-primary" />
            <p className="text-sm font-medium">Free delivery all over India on every order</p>
          </div>
        </Reveal>
      </div>

      {checkoutProduct && <CheckoutDialog product={checkoutProduct} onClose={() => setCheckoutProduct(null)} />}
    </section>
  );
}
