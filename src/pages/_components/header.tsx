import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBasket, User, X } from "lucide-react";
import { NAV } from "@/lib/site-config.ts";
import { useSiteSettings } from "@/hooks/use-site-settings.tsx";
import { cn } from "@/lib/utils.ts";
import { useCart } from "@/hooks/use-cart.tsx";
import { useProfile } from "@/hooks/use-profile.ts";
import CartDialog from "./cart-dialog.tsx";

const ICON_BTN = "relative grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { count } = useCart();
  const { profile, isSignedIn, openProfile } = useProfile();
  const settings = useSiteSettings();
  const initial = isSignedIn && profile ? profile.fullName.charAt(0).toUpperCase() : null;
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu when the visitor taps/clicks anywhere outside it.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <header ref={menuRef} className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border bg-card/85 px-4 py-2 text-foreground shadow-sm backdrop-blur-md">
        <a href="#top" className="flex items-center gap-2.5">
          <img src={settings.logoUrl} alt={settings.brand} className="size-9 rounded-full object-cover ring-1 ring-border" />
          <span className="font-serif text-xl font-semibold leading-none">
            {settings.brand}
            <span className="block text-[10px] font-sans uppercase tracking-[0.25em] text-muted-foreground">{settings.byline}</span>
          </span>
        </a>
        <ul className="hidden gap-6 text-sm lg:gap-7 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="transition-colors hover:text-primary">{n.label}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2.5">
          <a href="#booking" className="hidden rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-transform hover:scale-105 md:inline-block">
            Book Now
          </a>
          <button aria-label={`Open basket (${count} items)`} onClick={() => setShowCart(true)} className={ICON_BTN}>
            <ShoppingBasket className="size-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
                {count}
              </span>
            )}
          </button>
          <button aria-label="My profile" title="My profile" onClick={() => openProfile()} className={cn(ICON_BTN, initial && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}>
            {initial ? <span className="font-serif text-lg font-semibold">{initial}</span> : <User className="size-5" />}
          </button>
          <button aria-label="Menu" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      <div className={cn("mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm backdrop-blur-md transition-all md:hidden", open ? "mt-2 max-h-[36rem]" : "max-h-0 border-transparent")}>
        <ul className="flex flex-col p-4 text-foreground">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} onClick={() => setOpen(false)} className="block py-3 text-lg">{n.label}</a>
            </li>
          ))}
          <li>
            <button
              onClick={() => {
                openProfile();
                setOpen(false);
              }}
              className="flex items-center gap-2 py-3 text-lg"
            >
              <User className="size-4" /> My Profile
            </button>
          </li>
        </ul>
      </div>

      <CartDialog open={showCart} onClose={() => setShowCart(false)} />
    </header>
  );
}
