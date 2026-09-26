// Admin-created popup coupon banner, shown once per browser session so it doesn't nag
// returning visitors on every page view.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { usePromoBanners } from "@/hooks/use-promo-banners.ts";

const SESSION_KEY = "bb-popup-banner-shown";

export default function PopupBanner() {
  const banners = usePromoBanners("popup");
  const banner = banners[0];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!banner || sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 1200);
    return () => clearTimeout(timer);
  }, [banner]);

  if (!banner) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0" showClose={false}>
        <DialogTitle className="sr-only">{banner.title}</DialogTitle>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <X className="size-4" />
        </button>
        {banner.kind === "image" && banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="w-full rounded-2xl object-cover" />
        ) : banner.kind === "html" && banner.html ? (
          // Admin-authored HTML, entered in the admin panel by the studio owner.
          <div className="p-6" dangerouslySetInnerHTML={{ __html: banner.html }} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
