import { useState } from "react";
import { LogOut, Menu, User, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site-config.ts";
import { cn } from "@/lib/utils.ts";
import { useCustomerAuth } from "@/hooks/use-customer-auth.ts";
import { isSupabaseConfigured } from "@/lib/supabase.ts";
import SignInDialog from "./sign-in-dialog.tsx";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const { isSignedIn, user, signOut } = useCustomerAuth();

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
        <div className="hidden items-center gap-3 md:flex">
          {isSupabaseConfigured && (
            isSignedIn ? (
              <button onClick={() => void signOut()} title={user?.email ?? undefined} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20">
                <LogOut className="size-3.5" /> Sign Out
              </button>
            ) : (
              <button onClick={() => setShowSignIn(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20">
                <User className="size-3.5" /> Sign In
              </button>
            )
          )}
          <a href="#booking" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-transform hover:scale-105">
            Book Now
          </a>
        </div>
        <button aria-label="Menu" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      <div className={cn("mx-auto max-w-6xl overflow-hidden rounded-3xl bg-black/70 backdrop-blur-md transition-all md:hidden", open ? "mt-2 max-h-[32rem]" : "max-h-0")}>
        <ul className="flex flex-col p-4 text-white">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} onClick={() => setOpen(false)} className="block py-3 text-lg">{n.label}</a>
            </li>
          ))}
          {isSupabaseConfigured && (
            <li>
              {isSignedIn ? (
                <button
                  onClick={() => {
                    void signOut();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 py-3 text-lg"
                >
                  <LogOut className="size-4" /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowSignIn(true);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 py-3 text-lg"
                >
                  <User className="size-4" /> Sign In
                </button>
              )}
            </li>
          )}
        </ul>
      </div>

      <SignInDialog open={showSignIn} onClose={() => setShowSignIn(false)} />
    </header>
  );
}
