import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import SocialButtons from "@/components/social-buttons.tsx";
import { NAV, SITE } from "@/lib/site-config.ts";

// My Orders stays in the header menu only.
const FOOTER_NAV = NAV.filter((n) => n.href !== "#my-orders");

const POLICIES = [
  {
    title: "Privacy Policy",
    points: [
      "We only collect the details needed to deliver your order: your name, phone number, delivery address and the email you sign in with.",
      "Sign in is handled securely with an email link or Google. We never see or store your password.",
      "Payments are processed securely by Razorpay. We never see or store your card, UPI or bank details. We only keep the payment reference for your order.",
      "Your orders are private. Only you can see them in My Orders when you are signed in.",
      "Your details are used only to process and deliver your order, share tracking updates and manage appointments. We share your delivery details only with our courier partner, and we never sell your data.",
      "Booking requests are placed into a WhatsApp message on your own device. Nothing is sent until you press Send in WhatsApp.",
      "Your basket is saved only in your own browser and is not sent to us until you check out.",
      "Clicking WhatsApp, Instagram or Google Maps takes you to those services, which have their own privacy policies.",
      "Want your account or order details deleted? Message us on WhatsApp and we will remove them.",
      `For any privacy question, message us on WhatsApp or visit us at ${SITE.address}.`,
    ],
  },
  {
    title: "Shipping Policy",
    points: [
      "We offer free delivery all over India on every ready-to-shop and custom nail set order.",
      "Ready-to-shop sets are usually dispatched within 1-3 business days of order confirmation.",
      "Custom and bridal sets are dispatched once the design is finalised, typically within 5-7 business days.",
      "Once your order is shipped, you can follow its delivery in My Orders, and we'll also share tracking details on WhatsApp.",
      "Delivery timelines may vary slightly for remote locations.",
    ],
  },
  {
    title: "Cancellation & Refund Policy",
    points: [
      "Ready-to-shop sets: you may cancel your order for a full refund any time before it is dispatched. Once shipped, the order cannot be cancelled.",
      "Custom & bridal sets: since these are made specifically for you, cancellations are accepted only before we begin creating your design. Once work has started, the order cannot be cancelled or refunded.",
      "Appointments: kindly inform us at least 24 hours in advance to cancel or reschedule a studio appointment at no charge.",
      "Damaged or incorrect items: if your set arrives damaged or different from what was ordered, message us on WhatsApp within 48 hours of delivery with photos, and we will offer a free replacement or a full refund.",
      "Refunds, once approved, are processed to the original payment method within 5-7 business days.",
      "As press-on nail sets are a personal-use product, we cannot accept returns or refunds simply for a change of mind once the order has shipped.",
      "For any cancellation or refund request, please contact us on WhatsApp with your order details.",
    ],
  },
  {
    title: "Terms",
    points: [
      "Appointments are confirmed only after we reply to your WhatsApp booking request.",
      "Online shop orders are confirmed once your payment is successful. Custom orders are confirmed after we reply on WhatsApp and confirm payment.",
      "Please arrive on time for studio appointments. Late arrivals may get a shorter session or need to reschedule.",
      "Kindly inform us at least 24 hours in advance if you need to cancel or reschedule an appointment.",
      "Final prices for custom work depend on the design, length and add-ons, and are shared before the service or order is confirmed.",
      "Portfolio and shop images are for inspiration. Final results may vary slightly with nail shape and length.",
      "Please tell us about any allergies or skin or nail conditions before your service.",
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/40 px-5 pb-6 pt-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <img src={SITE.logo} alt={SITE.brand} className="mt-2 size-12 shrink-0 rounded-full object-cover ring-1 ring-border" />
          <div>
            <p className="font-serif text-2xl font-semibold leading-tight">{SITE.brand}</p>
            <p className="text-sm leading-snug text-muted-foreground">{SITE.byline} · Nail Art Studio, Rajkot, Gujarat 360001</p>
            <SocialButtons className="pt-4" />
          </div>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {FOOTER_NAV.map((n) => (
              <li key={n.href}><a href={n.href} className="hover:text-primary">{n.label}</a></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center gap-3 border-t pt-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {SITE.brand} {SITE.byline}. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-6">
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
