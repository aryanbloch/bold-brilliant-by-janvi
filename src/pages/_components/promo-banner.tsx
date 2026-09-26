// Renders an admin-created coupon banner (image or raw HTML) for a given placement, or nothing
// if there's no live banner there. Used on the top bar, hero, shop, checkout and as a popup.
import { usePromoBanners, type PromoBanner as PromoBannerType } from "@/hooks/use-promo-banners.ts";
import { cn } from "@/lib/utils.ts";

export default function PromoBanner({ placement, className }: { placement: PromoBannerType["placement"]; className?: string }) {
  const banners = usePromoBanners(placement);
  const banner = banners[0];
  if (!banner) return null;

  const content =
    banner.kind === "image" && banner.imageUrl ? (
      <img src={banner.imageUrl} alt={banner.title} className="w-full rounded-2xl object-cover" />
    ) : banner.kind === "html" && banner.html ? (
      // Admin-authored HTML, entered in the admin panel by the studio owner - not end-user input.
      <div dangerouslySetInnerHTML={{ __html: banner.html }} />
    ) : null;

  if (!content) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target={banner.linkUrl.startsWith("#") ? undefined : "_blank"} rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
