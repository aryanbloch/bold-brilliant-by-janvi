import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, PackageSearch, Search } from "lucide-react";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { Input } from "@/components/ui/input.tsx";

type Checkpoint = { status: string; date: string; location?: string };
type TrackResponse = { found: boolean; courier?: string; status?: string; checkpoints?: Checkpoint[]; error?: string };

export default function TrackOrder() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResponse | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
      });
      const data = (await res.json()) as TrackResponse;
      setResult(data);
    } catch {
      setResult({ found: false, error: "Something went wrong. Please try again or message us on WhatsApp." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="track" className="px-5 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <SectionHeading eyebrow="Delivery" title="Track Your Order" sub="Enter the tracking number we shared with you to see live delivery status." />
        <Reveal>
          <form onSubmit={handleTrack} className="flex flex-col gap-3 rounded-3xl border bg-card/70 p-5 backdrop-blur sm:flex-row sm:p-2">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter your tracking / AWB number"
              className="h-12 flex-1 rounded-xl border-0 bg-background/70 sm:rounded-full sm:pl-5"
            />
            <button
              type="submit"
              disabled={loading || !trackingNumber.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Track
            </button>
          </form>
        </Reveal>

        {result && (
          <Reveal delay={0.05}>
            <div className="mt-6 rounded-3xl border bg-card/70 p-6 backdrop-blur">
              {result.found ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <PackageSearch className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{result.courier}</p>
                      <p className="font-serif text-xl">{result.status}</p>
                    </div>
                  </div>
                  {result.checkpoints && result.checkpoints.length > 0 && (
                    <ol className="mt-6 space-y-4 border-l pl-5">
                      {result.checkpoints.map((c, i) => (
                        <li key={`${c.date}-${i}`} className="relative">
                          <span className="absolute -left-[26px] top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                            {i === 0 && <CheckCircle2 className="size-4" />}
                          </span>
                          <p className="text-sm font-medium">{c.status}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {c.location && (
                              <>
                                <MapPin className="size-3" /> {c.location} ·{" "}
                              </>
                            )}
                            {new Date(c.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground">{result.error}</p>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
