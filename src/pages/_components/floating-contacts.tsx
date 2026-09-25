import { motion } from "motion/react";
import { InstagramLogo, WhatsappLogo } from "@phosphor-icons/react";
import { SITE, whatsappLink } from "@/lib/site-config.ts";

const BUTTONS = [
  { label: "Chat on WhatsApp", href: whatsappLink(), Icon: WhatsappLogo, cls: "bg-[#25D366]" },
  { label: "Instagram", href: SITE.instagramUrl, Icon: InstagramLogo, cls: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
];

export default function FloatingContacts() {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 md:bottom-6 md:right-6">
      {BUTTONS.map(({ label, href, Icon, cls }) => (
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
          <Icon size={30} weight={label === "Instagram" ? "bold" : "fill"} />
        </motion.a>
      ))}
    </div>
  );
}
