// Shared small UI bits reused across every admin tab, so each tab stays focused on its own data.
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export const FIELD = "h-10 w-full rounded-xl border bg-background px-3 text-sm";
export const LABEL = "block pb-1.5 text-xs font-medium text-muted-foreground";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border bg-card p-5 ${className}`}>{children}</div>;
}

export function AdminButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border bg-background hover:bg-muted",
    danger: "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${checked ? "border-primary/40 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
    >
      <span className={`size-2 rounded-full ${checked ? "bg-primary" : "bg-muted-foreground/50"}`} />
      {label}
    </button>
  );
}

export function Spinner() {
  return <Loader2 className="size-4 animate-spin" />;
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
