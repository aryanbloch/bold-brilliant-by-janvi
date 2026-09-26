import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";

// Floating button that appears after scrolling down and takes the visitor back to the top.
// Sits above the mobile bottom nav bar.
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="back-to-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 z-40 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl ring-2 ring-background/70 md:bottom-6 md:right-6 md:size-16"
        >
          <ArrowUp className="size-6 md:size-7" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
