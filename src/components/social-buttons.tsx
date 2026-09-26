import { FacebookLogo, InstagramLogo, TelegramLogo, WhatsappLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useSiteSettings, whatsappLinkFor } from "@/hooks/use-site-settings.tsx";
import { cn } from "@/lib/utils.ts";

// Logo-only round buttons, shown side by side. Each one is individually switched on/off from
// Admin > Contact & Social (WhatsApp and Instagram default to on, the rest default to off).
export default function SocialButtons({ className }: { className?: string }) {
  const s = useSiteSettings();
  const links = [
    s.showWhatsapp && { label: "WhatsApp", href: whatsappLinkFor(s.whatsappNumber), Icon: WhatsappLogo, weight: "fill" as const, cls: "bg-[#25D366]" },
    s.showInstagram && { label: "Instagram", href: s.instagramUrl, Icon: InstagramLogo, weight: "bold" as const, cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
    s.showFacebook && { label: "Facebook", href: s.facebookUrl, Icon: FacebookLogo, weight: "fill" as const, cls: "bg-[#1877F2]" },
    s.showYoutube && { label: "YouTube", href: s.youtubeUrl, Icon: YoutubeLogo, weight: "fill" as const, cls: "bg-[#FF0000]" },
    s.showX && { label: "X", href: s.xUrl, Icon: XLogo, weight: "bold" as const, cls: "bg-black" },
    s.showTelegram && { label: "Telegram", href: s.telegramUrl, Icon: TelegramLogo, weight: "fill" as const, cls: "bg-[#26A5E4]" },
  ].filter((l): l is Exclude<typeof l, false> => Boolean(l) && Boolean(l.href));

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
