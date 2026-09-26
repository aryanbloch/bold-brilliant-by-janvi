import { InstagramLogo, WhatsappLogo } from "@phosphor-icons/react";
import { useSiteSettings, whatsappLinkFor } from "@/hooks/use-site-settings.tsx";
import { cn } from "@/lib/utils.ts";

// Logo-only round buttons, shown side by side.
export default function SocialButtons({ className }: { className?: string }) {
  const settings = useSiteSettings();
  const links = [
    { label: "WhatsApp", href: whatsappLinkFor(settings.whatsappNumber), Icon: WhatsappLogo, weight: "fill" as const, cls: "bg-[#25D366]" },
    { label: "Instagram", href: settings.instagramUrl, Icon: InstagramLogo, weight: "bold" as const, cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
  ];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {links.map(({ label, href, Icon, weight, cls }) => (
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
