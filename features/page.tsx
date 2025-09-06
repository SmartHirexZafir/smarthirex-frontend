// app/features/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/* =========================
 *  Types
 * ========================= */
type RawFeatures =
  | { features?: any; sections?: any; data?: any }
  | any[];

type Feature = {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  icon?: string; // remix icon class, e.g. "ri-robot-2-line"
};

/* =========================
 *  Config & helpers
 * ========================= */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

const ENDPOINTS = [
  // Primary: backend static usage guide you mentioned
  `${API_BASE}/static/usage_guide.json`,
  // Potential alternates if you wire them on backend
  `${API_BASE}/docs/features`,
  `${API_BASE}/dashboard/features`,
];

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function toId(s: string, i: number) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `feature-${i}`
  );
}

function normalizeFeature(obj: any, i: number, fallbackCategory?: string): Feature | null {
  if (!obj) return null;

  // Common keys we might see from your docx->json or usage_guide.json
  const title =
    obj.title ||
    obj.name ||
    obj.feature ||
    (typeof obj === "string" ? obj : null);

  const description =
    obj.description ||
    obj.details ||
    obj.detail ||
    obj.text ||
    (typeof obj === "string" ? obj : "");

  if (!isNonEmptyString(title)) return null;

  const id = isNonEmptyString(obj.id) ? obj.id : toId(String(title), i);
  const category = obj.category || fallbackCategory || undefined;

  // Accept comma-separated tags or arrays
  let tags: string[] | undefined = undefined;
  const rawTags = obj.tags || obj.labels || obj.keywords;
  if (Array.isArray(rawTags)) {
    tags = rawTags.map((t) => String(t)).filter(isNonEmptyString);
  } else if (isNonEmptyString(rawTags)) {
    tags = rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(isNonEmptyString);
  }

  const icon =
    obj.icon ||
    // Soft map some known names to remix-icon classes
    (String(title).match(/ai|smart|ml|model/i)
      ? "ri-robot-2-line"
      : String(title).match(/upload|resume|cv/i)
      ? "ri-upload-2-line"
      : String(title).match(/test|assessment|quiz/i)
      ? "ri-test-tube-line"
      : String(title).match(/meeting|schedule|calendar/i)
      ? "ri-calendar-event-line"
      : String(title).match(/filter|search|query/i)
      ? "ri-filter-3-line"
      : String(title).match(/dashboard|stats|analytics/i)
      ? "ri-dashboard-line"
      : String(title).match(/history|log|timeline/i)
      ? "ri-time-line"
      : String(title).match(/profile|account|user/i)
      ? "ri-user-3-line"
      : "ri-sparkling-2-line");

  return {
    id,
    title: String(title),
    description: String(description),
    category: isNonEmptyString(category) ? category : undefined,
    tags,
    icon,
  };
}

function normalizeFeatures(raw: RawFeatures): Feature[] {
  // Case 1: Array of items (strings or objects)
  if (Array.isArray(raw)) {
    return raw
      .map((x, i) => normalizeFeature(x, i))
      .filter((x): x is Feature => !!x);
  }

  // Case 2: Object holding features
  if (raw && typeof raw === "object") {
    // Direct features array
    if (Array.isArray((raw as any).features)) {
      return (raw as any).features
        .map((x: any, i: number) => normalizeFeature(x, i))
        .filter((x: Feature | null): x is Feature => !!x);
    }

    // Sections (e.g., { sections: [{ title, items: [...] }, ...] })
    if (Array.isArray((raw as any).sections)) {
      const out: Feature[] = [];
      (raw as any).sections.forEach((sec: any, si: number) => {
        const cat = sec?.title || sec?.name || undefined;
        const items = Array.isArray(sec?.items)
          ? sec.items
          : Array.isArray(sec?.features)
          ? sec.features
          : [];
        items.forEach((it: any, ii: number) => {
          const norm = normalizeFeature(it, si * 1000 + ii, cat);
          if (norm) out.push(norm);
        });
      });
      return out;
    }

    // Sometimes people put the array under "data"
    if (Array.isArray((raw as any).data)) {
      return (raw as any).data
        .map((x: any, i: number) => normalizeFeature(x, i))
        .filter((x: Feature | null): x is Feature => !!x);
    }
  }

  return [];
}

async function fetchFirstAvailable<T = any>(urls: string[], timeoutMs = 8000): Promise<T | null> {
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      if (!res.ok) continue;
      const txt = await res.text();
      try {
        return JSON.parse(txt) as T;
      } catch {
        // If it's plain text, wrap it as an array of strings
        return ([txt] as unknown) as T;
      }
    } catch {
      // try next
    }
  }
  return null;
}

/* =========================
 *  Page
 * ========================= */
export default function FeaturesPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);

  // Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        // Try multiple known endpoints (backend can choose one)
        const raw = await fetchFirstAvailable<RawFeatures>(ENDPOINTS);
        const normalized = normalizeFeatures(raw || []);
        if (!cancelled) {
          setAllFeatures(normalized);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load features.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allFeatures.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allFeatures]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    allFeatures.forEach((f) => (f.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allFeatures]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFeatures.filter((f) => {
      if (category !== "all" && (f.category || "other") !== category) return false;
      if (activeTags.length > 0) {
        const ft = new Set((f.tags || []).map((t) => t.toLowerCase()));
        for (const t of activeTags.map((t) => t.toLowerCase())) {
          if (!ft.has(t)) return false;
        }
      }
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.category || "").toLowerCase().includes(q) ||
        (f.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allFeatures, query, category, activeTags]);

  const toggleTag = (t: string) => {
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <div className="min-h-screen bg-background page-aurora">
      {/* Page Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-lg border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="p-2 rounded-lg transition-colors text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Go home"
              >
                <i className="ri-arrow-left-line text-xl" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <i className="ri-sparkling-2-line mr-3 text-foreground/80" />
                  Features
                </h1>
                <p className="text-sm text-muted-foreground">
                  Everything included in SmartHireX — searchable, filterable, and always up to date.
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <a
                href="/pricing"
                className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-price-tag-3-line mr-2" />
                Pricing
              </a>
              <a
                href="/docs"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-book-open-line mr-2" />
                Docs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs text-muted-foreground">Search</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-2">
                  <i className="ri-search-line text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="text"
                    placeholder="Search features, tags, categories…"
                    className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    aria-label="Search features"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                    setActiveTags([]);
                  }}
                  className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <i className="ri-close-line mr-1" />
                  Clear
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Filter by category"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag Chips */}
          {tags.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-1">Tags</div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = activeTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-foreground border-border hover:bg-muted/70"
                      }`}
                      aria-pressed={active}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-10">
        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5 shadow-xl"
              >
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse mb-3" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse mb-2" />
                <div className="h-3 w-full rounded bg-muted animate-pulse mb-1.5" />
                <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {err && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {err}
          </div>
        )}

        {/* Empty state */}
        {!loading && !err && filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
              <i className="ri-search-eye-line text-2xl text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold">No features found</div>
            <div className="text-sm text-muted-foreground mt-1">
              Try clearing filters or searching a different keyword.
            </div>
          </div>
        )}

        {/* Features grid */}
        {!loading && !err && filtered.length > 0 && (
          <>
            <div className="mb-3 text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span>{" "}
              of <span className="font-medium text-foreground">{allFeatures.length}</span> features
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((f) => (
                <article
                  key={f.id}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <i className={`${f.icon || "ri-sparkling-2-line"} text-lg`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold leading-tight text-foreground">
                        {f.title}
                      </h3>
                      {f.category && (
                        <div className="mt-1 inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                          {f.category}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {f.description}
                  </p>

                  {f.tags && f.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {f.tags.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full border border-border bg-muted text-[11px] text-foreground/90"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
