// Policy & about page text admin tab: edit Privacy Policy, Terms, Refund Policy, Shipping
// Policy, About text, Founder bio, "Why choose us" cards and FAQ. Reads/writes the site_content
// table (src/hooks/use-site-content.ts). Text pages are a single textarea; list pages
// (why_choose_us, faq) are editable rows saved as JSON.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { adminApi } from "./api.ts";
import { AdminButton, EmptyRow, FIELD, LABEL, Spinner } from "./ui.tsx";

type ContentRow = { key: string; title: string | null; body: string; format: string };
type WhyCard = { title: string; text: string };
type FaqItem = { q: string; a: string };

const TEXT_PAGES: { key: string; label: string }[] = [
  { key: "about", label: "About" },
  { key: "founder", label: "Founder Bio" },
  { key: "privacy_policy", label: "Privacy Policy" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "refund_policy", label: "Refund & Return Policy" },
  { key: "shipping_policy", label: "Shipping Policy" },
];

function parseList<T>(body: string): T[] {
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export default function ContentTab({ password }: { password: string }) {
  const [rows, setRows] = useState<Record<string, ContentRow> | null>(null);
  const [active, setActive] = useState<string>(TEXT_PAGES[0].key);
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

  const saveKey = async (key: string, title: string | null, body: string, format: string) => {
    setSaving(true);
    const { ok, data } = await adminApi.update(password, "site_content", { key, title: title ?? "", body, format });
    setSaving(false);
    if (!ok) {
      toast.error(data.error ?? "Could not save");
      return;
    }
    toast.success("Saved");
  };

  if (rows === null) return <EmptyRow>Loading content...</EmptyRow>;

  const PAGES = [
    ...TEXT_PAGES,
    { key: "why_choose_us", label: "Why Choose Us" },
    { key: "faq", label: "FAQ" },
  ];
  const current = rows[active];
  const isTextPage = TEXT_PAGES.some((p) => p.key === active);

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

      {isTextPage && (
        <div>
          <label className={LABEL}>{PAGES.find((p) => p.key === active)?.label} Text</label>
          <textarea
            className={`${FIELD} h-64 py-3`}
            value={current?.body ?? ""}
            onChange={(e) => setRows({ ...rows, [active]: { key: active, title: current?.title ?? null, body: e.target.value, format: "text" } })}
            placeholder="Leave blank to show the site's default built-in text."
          />
          <p className="pt-1 text-xs text-muted-foreground">Leave blank to keep showing the site's default text for this page.</p>
          <AdminButton className="mt-3" onClick={() => void saveKey(active, current?.title ?? null, current?.body ?? "", "text")} disabled={saving}>
            {saving ? <Spinner /> : <Save className="size-4" />} Save
          </AdminButton>
        </div>
      )}

      {active === "why_choose_us" && (
        <WhyChooseUsEditor
          body={current?.body ?? ""}
          saving={saving}
          onSave={(body) => void saveKey("why_choose_us", "Why Choose Us", body, "json")}
        />
      )}

      {active === "faq" && (
        <FaqEditor body={current?.body ?? ""} saving={saving} onSave={(body) => void saveKey("faq", "FAQ", body, "json")} />
      )}
    </div>
  );
}

function WhyChooseUsEditor({ body, saving, onSave }: { body: string; saving: boolean; onSave: (body: string) => void }) {
  const [cards, setCards] = useState<WhyCard[]>(() => parseList<WhyCard>(body));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Leave empty to show the site's default 4 cards.</p>
      {cards.map((c, i) => (
        <div key={i} className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-[1fr_2fr_auto]">
          <input className={FIELD} placeholder="Title" value={c.title} onChange={(e) => setCards(cards.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
          <input className={FIELD} placeholder="Description" value={c.text} onChange={(e) => setCards(cards.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))} />
          <AdminButton variant="danger" onClick={() => setCards(cards.filter((_, idx) => idx !== i))}>
            <Trash2 className="size-3.5" />
          </AdminButton>
        </div>
      ))}
      <div className="flex gap-2">
        <AdminButton variant="secondary" onClick={() => setCards([...cards, { title: "", text: "" }])}>
          <Plus className="size-3.5" /> Add Card
        </AdminButton>
        <AdminButton onClick={() => onSave(JSON.stringify(cards))} disabled={saving}>
          {saving ? <Spinner /> : <Save className="size-4" />} Save
        </AdminButton>
      </div>
    </div>
  );
}

function FaqEditor({ body, saving, onSave }: { body: string; saving: boolean; onSave: (body: string) => void }) {
  const [items, setItems] = useState<FaqItem[]>(() => parseList<FaqItem>(body));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Leave empty to show the site's default questions.</p>
      {items.map((f, i) => (
        <div key={i} className="space-y-2 rounded-2xl border p-3">
          <div className="flex gap-2">
            <input className={FIELD} placeholder="Question" value={f.q} onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, q: e.target.value } : x)))} />
            <AdminButton variant="danger" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
              <Trash2 className="size-3.5" />
            </AdminButton>
          </div>
          <textarea className={`${FIELD} h-20 py-2`} placeholder="Answer" value={f.a} onChange={(e) => setItems(items.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)))} />
        </div>
      ))}
      <div className="flex gap-2">
        <AdminButton variant="secondary" onClick={() => setItems([...items, { q: "", a: "" }])}>
          <Plus className="size-3.5" /> Add Question
        </AdminButton>
        <AdminButton onClick={() => onSave(JSON.stringify(items))} disabled={saving}>
          {saving ? <Spinner /> : <Save className="size-4" />} Save
        </AdminButton>
      </div>
    </div>
  );
}
