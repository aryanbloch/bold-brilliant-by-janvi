import { InstagramLogo } from "@phosphor-icons/react";
import AmbientVideo from "@/components/ambient-video.tsx";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { SITE } from "@/lib/site-config.ts";

export default function Showcase() {
  return (
    <section className="relative overflow-hidden bg-[#1f0a15] px-5 pb-16 pt-0 text-white md:pb-24 md:pt-14">
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-600/25 blur-[80px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <Reveal>
          <div className="relative -mx-5 overflow-hidden bg-black md:mx-auto md:w-full md:rounded-[3rem] md:border md:border-white/15 md:shadow-[0_30px_100px_-20px_rgba(236,72,153,0.55)]">
            <AmbientVideo lazy src={SITE.videos.showcase} className="block h-auto w-full" />
          </div>
        </Reveal>
        <div>
          <div className="text-left [&_div]:mx-0 [&_div]:text-left">
            <SectionHeading eyebrow="In the studio" title="Watch The Art Come To Life" sub="From prep to the final gloss, every detail is hand-finished in our Rajkot studio." />
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600">
                  <InstagramLogo size={30} weight="bold" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl">More Designs on Instagram</h3>
                  <p className="text-sm text-white/70">@{SITE.instagramUser}</p>
                </div>
              </div>
              <p className="pt-4 text-sm text-white/70">Fresh sets, behind-the-scenes and client favourites, posted every week.</p>
              <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-medium transition-transform hover:scale-105">
                Follow on Instagram
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
