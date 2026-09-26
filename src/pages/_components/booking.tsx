import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WhatsappLogo } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { useSiteSettings, whatsappLinkFor } from "@/hooks/use-site-settings.tsx";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import { toast } from "sonner";

const SERVICES = ["Classic Nail Art", "French Nails", "3D Nail Art", "Bridal Nails", "Luxury Nail Art", "Custom Design"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid WhatsApp number"),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  service: z.enum(SERVICES, { message: "Select a service" }),
  message: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const FIELD = "h-12 rounded-xl bg-background/70";

export default function Booking() {
  const settings = useSiteSettings();
  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: FormValues) => {
    // Save the request so the studio owner can manage it from the admin panel, then also open
    // WhatsApp for an instant heads-up (best of both: tracked + immediate).
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("bookings").insert({
        name: d.name,
        phone: d.phone,
        preferred_date: d.date,
        preferred_time: d.time,
        service: d.service,
        message: d.message?.trim() || null,
      });
      if (error) {
        toast.error("Could not save your booking request. Please try again or message us on WhatsApp.");
        return;
      }
      toast.success("Booking request sent! We'll confirm shortly.");
      reset();
    }

    const text = `Hello! I would like to book a nail-art appointment.

Name: ${d.name}
WhatsApp: ${d.phone}
Date: ${d.date}
Time: ${d.time}
Service: ${d.service}
Message: ${d.message?.trim() || "-"}`;
    window.open(whatsappLinkFor(settings.whatsappNumber, text), "_blank", "noopener");
  };

  const err = (k: keyof FormValues) => errors[k] && <p className="pt-1 text-xs text-destructive">{errors[k]?.message}</p>;

  return (
    <section id="booking" className="relative overflow-hidden px-5 py-16 md:py-24">
      <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-primary/20 blur-[70px]" />
      <div className="absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-accent/30 blur-[70px]" />
      <div className="relative mx-auto max-w-3xl">
        <SectionHeading eyebrow="Appointments" title="Book Your Nail Appointment" sub="Fill in your details and we'll confirm your slot on WhatsApp." />
        <Reveal>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 rounded-[2rem] border bg-card/60 p-6 shadow-2xl shadow-primary/10 backdrop-blur-sm sm:grid-cols-2 md:p-10">
            <div>
              <Label htmlFor="name" className="pb-2">Full Name</Label>
              <Input id="name" placeholder="Priya Shah" className={FIELD} {...register("name")} />
              {err("name")}
            </div>
            <div>
              <Label htmlFor="phone" className="pb-2">WhatsApp Number</Label>
              <Input id="phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" className={FIELD} {...register("phone")} />
              {err("phone")}
            </div>
            <div>
              <Label htmlFor="date" className="pb-2">Preferred Date</Label>
              <Input id="date" type="date" min={today} className={FIELD} {...register("date")} />
              {err("date")}
            </div>
            <div>
              <Label htmlFor="time" className="pb-2">Preferred Time</Label>
              <Input id="time" type="time" className={FIELD} {...register("time")} />
              {err("time")}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="service" className="pb-2">Nail Art Service</Label>
              <select id="service" defaultValue="" className={`${FIELD} w-full cursor-pointer border border-input px-3 text-sm`} {...register("service")}>
                <option value="" disabled>Select a service</option>
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {err("service")}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="message" className="pb-2">Message (optional)</Label>
              <Textarea id="message" rows={3} placeholder="Any design ideas or reference?" className="rounded-xl bg-background/70" {...register("message")} />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#25D366] font-medium text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 sm:col-span-2"
            >
              <WhatsappLogo size={22} weight="fill" /> {isSubmitting ? "Sending..." : "Book via WhatsApp"}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
