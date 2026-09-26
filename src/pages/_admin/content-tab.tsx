// Policy & about page text admin tab: edit Privacy Policy, Terms, Refund Policy, Shipping
// Policy and About text. Reads/writes the site_content table (src/hooks/use-site-content.ts).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { adminApi } from "./api.ts";
import { AdminButton, EmptyRow, FIELD, LABEL, Spinner } from "./ui.tsx";

type ContentRow = { key: string; title: string | null; body: string; format: string };

const PAGES: { key: string; label: string }[] = [
  { key: "about", label: "About" },
  { key: "privacy_policy", label: "Privacy Policy" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "refund_policy", label: "Refund & Return Policy" },
  { key: "shipping_policy", label: "Shipping Policy" },
];

export default function ContentTab({ password }: { password: string }) {
  const [rows, setRows] = useState<Record<string, ContentRow> | null>(null);
  const [active, setActive] = useState(PAGES[0].key);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void adminApi.list<ContentRow>(password, "site_content").then(({ ok, data }) => {
      if (!ok) {
        toast.error(data.error ?? "Could not load content");
        return;
      }
      const map: Record<string, ContentRow> = {};
      for (const r of data.rows ?? []) map[r.key] = r;
      setRows(map);
    });
  }, [password]);

  const save = async () => {
    if (!rows) return;
    const entry = rows[active];
    setSaving(true);
    const { ok, data } = await adminApi.update(password, "site_content", { key: active, title: entry?.title ?? "", body: entry?.body ?? "", format: "text" });
    setSaving(false);
    if (!ok) {
      toast.error(data.error ?? "Could not save");
      return;
    }
    toast.success("Saved");
  };

  if (rows === null) return <EmptyRow>Loading content...</EmptyRow>;
  const current = rows[active];

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Website Text</h2>
      <div className="flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active === p.key ? "bg-primary text-primary-foreground" : "border bg-background hover:bg-muted"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div>
        <label className={LABEL}>{PAGES.find((p) => p.key === active)?.label} Text</label>
        <textarea
          className={`${FIELD} h-64 py-3`}
          value={current?.body ?? ""}
          onChange={(e) => setRows({ ...rows, [active]: { key: active, title: current?.title ?? null, body: e.target.value, format: "text" } })}
          placeholder="Leave blank to show the default built-in text."
        />
        <p className="pt-1 text-xs text-muted-foreground">Leave blank to keep showing the site's default text for this page.</p>
      </div>
      <AdminButton onClick={() => void save()} disabled={saving}>
        {saving ? <Spinner /> : <Save className="size-4" />} Save
      </AdminButton>
    </div>
  );
}
