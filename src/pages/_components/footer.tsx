import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { NAV, SITE } from "@/lib/site-config.ts";

const POLICIES = [
  {
    title: "Privacy Policy",
    points: [
      "We do not store any personal data on this website. There are no accounts or logins.",
      "When you use the booking form, your details are placed into a WhatsApp message on your own device. Nothing is sent until you press Send in WhatsApp.",
      "Details you share with us on WhatsApp or Instagram are used only to manage your appointment and are never sold or shared.",
      "Clicking WhatsApp, Instagram or Google Maps takes you to those services, which have their own privacy policies.",
      `For any privacy question, message us on WhatsApp or visit us at ${SITE.address}.`,
    ],
  },
  {
    title: "Terms",
    points: [
      "Appointments are confirmed only after we reply to your WhatsApp booking request.",
      "Please arrive on time. Late arrivals may get a shorter session or need to reschedule.",
      "Kindly inform us at least 24 hours in advance if you need to cancel or reschedule.",
      "Final prices depend on the design, length and add-ons, and are shared before the service begins.",
      "Portfolio images are for inspiration. Final results may vary slightly with nail shape and length.",
      "Please tell us about any allergies or skin or nail conditions before your service.",
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/40 px-5 pb-6 pt-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-2xl font-semibold">{SITE.brand}</p>
          <p className="text-sm text-muted-foreground">{SITE.byline} · Nail Art Studio, Rajkot, Gujarat</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}><a href={n.href} className="hover:text-primary">{n.label}</a></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center gap-3 border-t pt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {SITE.brand} {SITE.byline}. All rights reserved.</p>
        <div className="flex justify-center gap-6">
          {POLICIES.map((p) => (
            <Dialog key={p.title}>
              <DialogTrigger className="cursor-pointer hover:text-primary">{p.title}</DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogTitle className="font-serif text-2xl">{p.title}</DialogTitle>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {p.points.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </footer>
  );
}
