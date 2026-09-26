import { motion } from "motion/react";
import { InstagramLogo, WhatsappLogo } from "@phosphor-icons/react";
import { useSiteSettings, whatsappLinkFor } from "@/hooks/use-site-settings.tsx";

// Floating WhatsApp / Instagram buttons. Each can be switched on/off from Admin > Contact & Social.
export default function FloatingContacts() {
  const s = useSiteSettings();
  const buttons = [
    s.showWhatsapp && { label: "Chat on WhatsApp", href: whatsappLinkFor(s.whatsappNumber), Icon: WhatsappLogo, cls: "bg-[#25D366]", weight: "fill" as const },
    s.showInstagram && { label: "Instagram", href: s.instagramUrl, Icon: InstagramLogo, cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600", weight: "bold" as const },
  ].filter((b): b is Exclude<typeof b, false> => Boolean(b));

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
