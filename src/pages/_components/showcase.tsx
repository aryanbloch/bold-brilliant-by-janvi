import { InstagramLogo } from "@phosphor-icons/react";
import AmbientVideo from "@/components/ambient-video.tsx";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { SITE } from "@/lib/site-config.ts";

export default function Showcase() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-rose-50/60 to-background px-5 pb-16 pt-0 md:pb-24 md:pt-14">
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-400/15 blur-[80px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <div className="relative isolate -mx-5 overflow-hidden bg-black [transform:translateZ(0)] md:mx-auto md:w-full md:rounded-[3rem] md:border md:border-border md:shadow-[0_30px_100px_-20px_rgba(236,72,153,0.35)]">
            <AmbientVideo lazy src={SITE.videos.showcase} className="block h-auto w-full md:rounded-[3rem]" />
          </div>
        </Reveal>
        <div>
          <div className="text-left [&_div]:mx-0 [&_div]:text-left">
            <SectionHeading eyebrow="In the studio" title="Watch The Art Come To Life" sub="From prep to the final gloss, every detail is hand-finished in our Rajkot studio." />
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white">
                  <InstagramLogo size={30} weight="bold" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl">More Designs on Instagram</h3>
                  <p className="text-sm text-muted-foreground">@{SITE.instagramUser}</p>
                </div>
              </div>
              <p className="pt-4 text-sm text-muted-foreground">Fresh sets, behind-the-scenes and client favourites, posted every week.</p>
              <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-105">
                Follow on Instagram
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
