import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import Reveal, { SectionHeading } from "@/components/reveal.tsx";
import { isSupabaseConfigured, supabase } from "@/lib/supabase.ts";
import { toast } from "sonner";

const SERVICES = ["Classic Nail Art", "French Nails", "3D Nail Art", "Bridal Nails", "Luxury Nail Art", "Custom Design"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number"),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  service: z.enum(SERVICES, { message: "Select a service" }),
  message: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const FIELD = "h-12 rounded-xl bg-background/70";

export default function Booking() {
  const today = new Date().toISOString().slice(0, 10);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Booking goes straight into Admin > Bookings (no WhatsApp redirect).
  const onSubmit = async (d: FormValues) => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Booking is not available right now. Please try again later.");
      return;
    }
    const { error } = await supabase.from("bookings").insert({
      name: d.name,
      phone: d.phone,
      preferred_date: d.date,
      preferred_time: d.time,
      service: d.service,
      message: d.message?.trim() || null,
    });
    if (error) {
      toast.error("Could not send your booking request. Please try again.");
      return;
    }
    toast.success("Booking request sent! We'll confirm shortly.");
    reset();
    setSent(true);
  };

  const err = (k: keyof FormValues) => errors[k] && <p className="pt-1 text-xs text-destructive">{errors[k]?.message}</p>;

  return (
    <section id="booking" className="relative overflow-hidden px-5 py-16 md:py-24">
      <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-primary/20 blur-[70px]" />
      <div className="absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-accent/30 blur-[70px]" />
      <div className="relative mx-auto max-w-3xl">
        <SectionHeading eyebrow="Appointments" title="Book Your Nail Appointment" sub="Fill in your details and we'll call you to confirm your slot." />
        <Reveal>
          {sent ? (
            <div className="flex flex-col items-center gap-4 rounded-[2rem] border bg-card/60 p-10 text-center shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <CheckCircle2 className="size-12 text-primary" />
              <h3 className="font-serif text-2xl">Request received!</h3>
              <p className="text-sm text-muted-foreground">We'll contact you soon to confirm your appointment.</p>
              <button onClick={() => setSent(false)} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Book another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 rounded-[2rem] border bg-card/60 p-6 shadow-2xl shadow-primary/10 backdrop-blur-sm sm:grid-cols-2 md:p-10">
              <div>
                <Label htmlFor="name" className="pb-2">Full Name</Label>
                <Input id="name" placeholder="Priya Shah" className={FIELD} {...register("name")} />
                {err("name")}
              </div>
              <div>
                <Label htmlFor="phone" className="pb-2">Phone Number</Label>
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
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 sm:col-span-2"
              >
                <CalendarCheck className="size-5" /> {isSubmitting ? "Sending..." : "Book Appointment"}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
