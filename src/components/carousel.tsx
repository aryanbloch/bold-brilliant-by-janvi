// Reusable swipeable row: native touch/trackpad swipe via scroll-snap, plus arrow buttons for
// mouse users. Optionally auto-advances on its own (autoPlay), pausing briefly while the visitor
// is interacting with it. Used by the Reviews section so cards slide left-right.
import { useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type CarouselProps = {
  children: ReactNode[];
  itemClassName?: string;
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
};

export default function Carousel({ children, itemClassName, className, autoPlay, autoPlayInterval = 3500 }: CarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  // Auto-advance through the cards, looping back to the start. Pauses while the visitor is
  // interacting with the row (touch, drag, wheel), then resumes shortly after.
  useEffect(() => {
    if (!autoPlay) return;
    const el = scrollerRef.current;
    if (!el) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.85, behavior: "smooth" });
      }
    }, autoPlayInterval);
    return () => window.clearInterval(id);
  }, [autoPlay, autoPlayInterval]);

  const pauseThenResume = () => {
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, autoPlayInterval);
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollerRef}
        onPointerDown={autoPlay ? pauseThenResume : undefined}
        onWheel={autoPlay ? pauseThenResume : undefined}
        className="flex snap-x snap-mandatory touch-pan-x gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 snap-center", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
      <button
        aria-label="Scroll left"
        onClick={() => {
          pauseThenResume();
          scrollByPage(-1);
        }}
        className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full border bg-background/90 p-2.5 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-110 md:grid md:place-items-center"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => {
          pauseThenResume();
          scrollByPage(1);
        }}
        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border bg-background/90 p-2.5 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-110 md:grid md:place-items-center"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
