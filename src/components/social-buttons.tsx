import { InstagramLogo, WhatsappLogo } from "@phosphor-icons/react";
import { SITE, whatsappLink } from "@/lib/site-config.ts";
import { cn } from "@/lib/utils.ts";

const LINKS = [
  { label: "WhatsApp", href: whatsappLink(), Icon: WhatsappLogo, weight: "fill", cls: "bg-[#25D366]" },
  { label: "Instagram", href: SITE.instagramUrl, Icon: InstagramLogo, weight: "bold", cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
] as const;

export default function SocialButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {LINKS.map(({ label, href, Icon, weight, cls }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105", cls)}
        >
          <Icon size={20} weight={weight} /> {label}
        </a>
      ))}
    </div>
  );
}
