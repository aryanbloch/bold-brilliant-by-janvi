import { useState } from "react";
import { ShoppingBasket, Sparkles, Truck } from "lucide-react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { whatsappLink } from "@/lib/site-config.ts";
import { READY_SETS, setImage, type CheckoutOrder } from "@/lib/catalog.ts";
import { useCart } from "@/hooks/use-cart.tsx";
import CheckoutDialog from "./checkout-dialog.tsx";

const CUSTOM_SETS = [
  { name: "Custom Everyday Set", price: "Starts at ₹699", desc: "Your choice of shape, length and 1-2 colours." },
  { name: "Custom 3D / Charm Set", price: "Starts at ₹1,299", desc: "Hand-placed charms, chrome, or 3D detailing." },
  { name: "Custom Bridal Set", price: "Starts at ₹1,999", desc: "Fully personalised bridal design with trial option." },
];

type ReadySet = (typeof READY_SETS)[number];

export default function Shop() {
  const [tab, setTab] = useState<"ready" | "custom">("ready");
  const [checkout, setCheckout] = useState<CheckoutOrder | null>(null);
  const { add } = useCart();

  const orderCustom = (name: string) => {
    const text = `Hello! I'm interested in the ${name}. Could you help me with the design and pricing?`;
    window.open(whatsappLink(text), "_blank", "noopener");
  };

  const addToBasket = (s: ReadySet) => {
    if (s.soldOut) return;
    add({ name: s.name, price: s.price, img: setImage(s.img) });
    toast.success(`${s.name} added to your basket`);
  };

  const buyNow = (s: ReadySet) => {
    if (s.soldOut) return;
    setCheckout({ items: [{ name: s.name, qty: 1 }], title: s.name, total: s.price });
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
          <div className="mx-auto grid max-w-md grid-cols-1 gap-6">
            {READY_SETS.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.06}>
                <div className="group relative overflow-hidden rounded-3xl border bg-card/70 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img src={setImage(s.img)} alt={`${s.name} press-on nail set`} loading="lazy" className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${s.soldOut ? "opacity-50" : ""}`} />
                    {s.soldOut && (
                      <span className="absolute left-3 top-3 rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-lg leading-tight">{s.name}</h3>
                    <p className="pt-1 text-sm font-medium text-primary">₹{s.price}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => buyNow(s)}
                        disabled={s.soldOut}
                        className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {s.soldOut ? "Sold Out" : "Buy Now"}
                      </button>
                      <button
                        aria-label={`Add ${s.name} to basket`}
                        title="Add to basket"
                        onClick={() => addToBasket(s)}
                        disabled={s.soldOut}
                        className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShoppingBasket className="size-4" />
                      </button>
                    </div>
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

      {checkout && <CheckoutDialog order={checkout} onClose={() => setCheckout(null)} />}
    </section>
  );
}
