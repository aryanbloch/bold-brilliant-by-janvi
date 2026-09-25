import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site-config.ts";
import { cn } from "@/lib/utils.ts";

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/20 bg-black/25 px-5 py-2.5 text-white backdrop-blur-md">
        <a href="#top" className="font-serif text-xl font-semibold leading-none">
          {SITE.brand}
          <span className="block text-[10px] font-sans uppercase tracking-[0.25em] text-white/70">{SITE.byline}</span>
        </a>
        <ul className="hidden gap-7 text-sm md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="transition-colors hover:text-pink-200">{n.label}</a>
            </li>
          ))}
        </ul>
        <a href="#booking" className="hidden rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-transform hover:scale-105 md:inline-block">
          Book Now
        </a>
        <button aria-label="Menu" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      <div className={cn("mx-auto max-w-6xl overflow-hidden rounded-3xl bg-black/70 backdrop-blur-md transition-all md:hidden", open ? "mt-2 max-h-96" : "max-h-0")}>
        <ul className="flex flex-col p-4 text-white">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} onClick={() => setOpen(false)} className="block py-3 text-lg">{n.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
