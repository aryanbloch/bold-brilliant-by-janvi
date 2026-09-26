// Reusable swipeable row: native touch/trackpad swipe via scroll-snap, plus arrow buttons for
// mouse users. Used by the Gallery and Reviews sections so images/cards slide left-right.
import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type CarouselProps = { children: ReactNode[]; itemClassName?: string; className?: string };

export default function Carousel({ children, itemClassName, className }: CarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollerRef}
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
        onClick={() => scrollByPage(-1)}
        className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full border bg-background/90 p-2.5 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-110 md:grid md:place-items-center"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => scrollByPage(1)}
        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border bg-background/90 p-2.5 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-110 md:grid md:place-items-center"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
