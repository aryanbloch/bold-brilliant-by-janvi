import { useEffect, useRef, useState } from "react";

type Props = { src: string; poster?: string; className?: string; lazy?: boolean };

// Controls-free ambient video. Lazy mode only loads/plays when on screen.
export default function AmbientVideo({ src, poster, className, lazy }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          el.play().catch(() => undefined);
        } else {
          el.pause();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={visible ? src : undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload={lazy ? "none" : "metadata"}
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
