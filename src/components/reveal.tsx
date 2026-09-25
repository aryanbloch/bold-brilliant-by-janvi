import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = { children: ReactNode; delay?: number; className?: string };

export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl pb-8 text-center md:pb-12">
      <p className="pb-3 text-xs font-medium uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="font-serif text-4xl font-semibold text-balance md:text-5xl">{title}</h2>
      {sub && <p className="pt-4 text-muted-foreground">{sub}</p>}
    </Reveal>
  );
}
