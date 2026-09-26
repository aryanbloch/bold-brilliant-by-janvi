import { InstagramLogo, WhatsappLogo } from "@phosphor-icons/react";
import { SITE, whatsappLink } from "@/lib/site-config.ts";
import { cn } from "@/lib/utils.ts";

const LINKS = [
  { label: "WhatsApp", href: whatsappLink(), Icon: WhatsappLogo, weight: "fill", cls: "bg-[#25D366]" },
  { label: "Instagram", href: SITE.instagramUrl, Icon: InstagramLogo, weight: "bold", cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
] as const;

// Logo-only round buttons, shown side by side.
export default function SocialButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {LINKS.map(({ label, href, Icon, weight, cls }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={cn("grid size-11 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-110", cls)}
        >
          <Icon size={22} weight={weight} />
        </a>
      ))}
    </div>
  );
}
