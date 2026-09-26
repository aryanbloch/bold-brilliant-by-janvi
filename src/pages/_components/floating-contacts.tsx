import { motion } from "motion/react";
import { FacebookLogo, InstagramLogo, TelegramLogo, WhatsappLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useSiteSettings, whatsappLinkFor } from "@/hooks/use-site-settings.tsx";

// Floating WhatsApp / Instagram / Facebook / YouTube / X / Telegram buttons. Each can be
// switched on/off from Admin > Contact & Social.
export default function FloatingContacts() {
  const s = useSiteSettings();
  const buttons = [
    s.showWhatsapp && { label: "Chat on WhatsApp", href: whatsappLinkFor(s.whatsappNumber), Icon: WhatsappLogo, cls: "bg-[#25D366]", weight: "fill" as const },
    s.showInstagram && { label: "Instagram", href: s.instagramUrl, Icon: InstagramLogo, cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600", weight: "bold" as const },
    s.showFacebook && { label: "Facebook", href: s.facebookUrl, Icon: FacebookLogo, cls: "bg-[#1877F2]", weight: "fill" as const },
    s.showYoutube && { label: "YouTube", href: s.youtubeUrl, Icon: YoutubeLogo, cls: "bg-[#FF0000]", weight: "fill" as const },
    s.showX && { label: "X", href: s.xUrl, Icon: XLogo, cls: "bg-black", weight: "bold" as const },
    s.showTelegram && { label: "Telegram", href: s.telegramUrl, Icon: TelegramLogo, cls: "bg-[#26A5E4]", weight: "fill" as const },
  ].filter((b): b is Exclude<typeof b, false> => Boolean(b) && Boolean(b.href));

  if (buttons.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 md:bottom-6 md:right-6">
      {buttons.map(({ label, href, Icon, cls, weight }) => (
        <motion.a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          className={`relative grid size-12 place-items-center rounded-full text-white shadow-xl ring-2 ring-white/70 md:size-16 ${cls}`}
        >
          <Icon size={30} weight={weight} />
        </motion.a>
      ))}
    </div>
  );
}
