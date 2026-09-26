// Bookings admin tab: appointment requests submitted from the website, with status management
// (New / Confirmed / Completed / Cancelled).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { adminApi } from "./api.ts";
import { AdminCard, EmptyRow, FIELD } from "./ui.tsx";

type Booking = {
  id: string;
  name: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  service: string;
  message: string | null;
  status: "New" | "Confirmed" | "Completed" | "Cancelled";
  created_at: string;
};

const STATUSES: Booking["status"][] = ["New", "Confirmed", "Completed", "Cancelled"];
const STATUS_COLOR: Record<Booking["status"], string> = {
  New: "bg-blue-500/10 text-blue-600",
  Confirmed: "bg-primary/10 text-primary",
  Completed: "bg-emerald-500/10 text-emerald-600",
  Cancelled: "bg-destructive/10 text-destructive",
};

export default function BookingsTab({ password }: { password: string }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const load = () => {
    void adminApi.list<Booking>(password, "bookings").then(({ ok, data }) => {
      if (ok) setBookings(data.rows ?? []);
      else toast.error(data.error ?? "Could not load bookings");
    });
  };
  useEffect(load, [password]);

  const updateStatus = async (b: Booking, status: Booking["status"]) => {
    const { ok, data } = await adminApi.update<Booking>(password, "bookings", { id: b.id, status });
    if (!ok) {
      toast.error(data.error ?? "Could not update booking");
      return;
    }
    setBookings((prev) => prev?.map((x) => (x.id === b.id ? { ...x, status } : x)) ?? null);
    toast.success("Booking updated");
  };

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Bookings</h2>

      {bookings === null ? (
        <EmptyRow>Loading bookings...</EmptyRow>
      ) : bookings.length === 0 ? (
        <EmptyRow>No appointment requests yet.</EmptyRow>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <AdminCard key={b.id} className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <CalendarClock className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{b.name} · {b.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.service} · {new Date(`${b.preferred_date}T00:00`).toLocaleDateString("en-IN", { dateStyle: "medium" })} at {b.preferred_time}
                  </p>
                  {b.message && <p className="pt-1 text-sm text-muted-foreground">{b.message}</p>}
                  <p className="pt-1 text-xs text-muted-foreground">Requested {new Date(b.created_at).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <select
                value={b.status}
                onChange={(e) => void updateStatus(b, e.target.value as Booking["status"])}
                className={`${FIELD} w-auto ${STATUS_COLOR[b.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
