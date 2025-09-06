// app/upload/FiltersFlyout.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createFocusTrap, lockBodyScroll, uid, cn } from "../../lib/util";

export type SectionKey =
  | "job_role"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "phrasing";

export type Filters = {
  // Shared/common
  location?: string;
  includeRelatedRoles?: boolean;

  // Job Role
  role?: string;

  // Experience
  minExp?: number;
  maxExp?: number;

  // Education
  education?: string[]; // degrees/titles

  // Skills
  skills_any?: string[];
  skills_all?: string[];

  // Projects
  projects_keywords?: string[];

  // CV phrasing
  phrasing_keywords?: string[];
};

export type ApplyPayload = {
  mode: "filters";
  section: SectionKey;
  filters: Filters;
  /** Optional: user also typed a free prompt at the top */
  prompt?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (payload: ApplyPayload) => void;
  /** Prepopulate form (optional) */
  initial?: Partial<ApplyPayload>;
  /** Parent's searching state to show inline spinner in CTA */
  applying?: boolean;
};

/* ------------------------------------------
   Small helpers
------------------------------------------ */
const sections: Array<{ id: SectionKey; label: string; icon: string; hint: string }> = [
  { id: "job_role",  label: "Job Role",          icon: "ri-briefcase-line",    hint: "Search by role title and related roles" },
  { id: "experience",label: "Experience",        icon: "ri-time-line",         hint: "Filter by years, range, and location" },
  { id: "education", label: "Education",         icon: "ri-graduation-cap-line",hint: "Degrees or specific certifications" },
  { id: "skills",    label: "Skills",            icon: "ri-magic-line",        hint: "Match ANY/ALL skills" },
  { id: "projects",  label: "Projects",          icon: "ri-git-merge-line",    hint: "Keywords within project descriptions" },
  { id: "phrasing",  label: "CV Phrasing",       icon: "ri-quill-pen-line",    hint: "Words/phrases from the CV wording" },
];

const degreeSuggestions = [
  "BSc Computer Science",
  "BS Software Engineering",
  "BE Computer Engineering",
  "MS Computer Science",
  "MBA",
  "PhD",
];

function parseCSVish(s: string): string[] {
  if (!s || !s.trim()) return [];
  // Split on comma or newline, trim, de-dup
  const raw = s
    .split(/[,;\n]/g)
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(raw));
}

function Num({ value }: { value?: number }) {
  return Number.isFinite(value) ? (value as number) : undefined;
}

/* ------------------------------------------
   Chips input (lightweight, no external deps)
------------------------------------------ */
function ChipsInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  function addChip(v: string) {
    const items = parseCSVish(v);
    if (items.length === 0) return;
    const next = Array.from(new Set([...value, ...items]));
    onChange(next);
    setDraft("");
  }
  function removeChip(idx: number) {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  }
  return (
    <div className="rounded-xl border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex flex-wrap gap-2">
        {value.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs"
          >
            {chip}
            <button
              type="button"
              className="icon-btn h-6 w-6"
              aria-label={`Remove ${chip}`}
              onClick={() => removeChip(i)}
              title="Remove"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          aria-label={ariaLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addChip(draft);
            }
            if (e.key === "Backspace" && !draft && value.length > 0) {
              // quick delete last chip
              removeChip(value.length - 1);
            }
          }}
          onBlur={() => addChip(draft)}
          placeholder={placeholder || "Type and press Enter…"}
          className="min-w-[140px] flex-1 bg-transparent px-2 py-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------
   Main component
------------------------------------------ */
export default function FiltersFlyout({
  open,
  onClose,
  onApply,
  initial,
  applying,
}: Props) {
  // ----- Flyout plumbing (focus trap, scroll lock, esc/overlay close) -----
  const containerRef = useRef<HTMLDivElement | null>(null);
  const focusTrapCleanup = useRef<(() => void) | null>(null);
  const bodyUnlockRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    // lock body scroll
    bodyUnlockRef.current = lockBodyScroll();
    // trap focus
    if (containerRef.current) {
      focusTrapCleanup.current = createFocusTrap(containerRef.current);
    }
    // esc to close
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      focusTrapCleanup.current?.();
      bodyUnlockRef.current?.();
    };
  }, [open, onClose]);

  // ----- State -----
  const [section, setSection] = useState<SectionKey>(
    (initial?.section as SectionKey) || "job_role"
  );
  const [prompt, setPrompt] = useState<string>(initial?.prompt || "");

  const [role, setRole] = useState<string>(initial?.filters?.role || "");
  const [location, setLocation] = useState<string>(
    initial?.filters?.location || ""
  );
  const [includeRelated, setIncludeRelated] = useState<boolean>(
    Boolean(initial?.filters?.includeRelatedRoles ?? true)
  );

  const [minExp, setMinExp] = useState<number | undefined>(
    Num({ value: initial?.filters?.minExp })
  );
  const [maxExp, setMaxExp] = useState<number | undefined>(
    Num({ value: initial?.filters?.maxExp })
  );

  const [education, setEducation] = useState<string[]>(
    initial?.filters?.education || []
  );

  const [skillsAny, setSkillsAny] = useState<string[]>(
    initial?.filters?.skills_any || []
  );
  const [skillsAll, setSkillsAll] = useState<string[]>(
    initial?.filters?.skills_all || []
  );

  const [proj, setProj] = useState<string[]>(
    initial?.filters?.projects_keywords || []
  );

  const [phrasing, setPhrasing] = useState<string[]>(
    initial?.filters?.phrasing_keywords || []
  );

  // quick reset
  function resetAll() {
    setPrompt("");
    setRole("");
    setLocation("");
    setIncludeRelated(true);
    setMinExp(undefined);
    setMaxExp(undefined);
    setEducation([]);
    setSkillsAny([]);
    setSkillsAll([]);
    setProj([]);
    setPhrasing([]);
  }

  // build payload
  const payload = useMemo<ApplyPayload>(() => {
    const filters: Filters = {
      location: location || undefined,
      includeRelatedRoles: includeRelated || undefined,
    };
    if (section === "job_role") {
      filters.role = role || undefined;
    } else if (section === "experience") {
      filters.minExp = Number.isFinite(minExp!) ? (minExp as number) : undefined;
      filters.maxExp = Number.isFinite(maxExp!) ? (maxExp as number) : undefined;
    } else if (section === "education") {
      filters.education = education.length ? education : undefined;
    } else if (section === "skills") {
      filters.skills_any = skillsAny.length ? skillsAny : undefined;
      filters.skills_all = skillsAll.length ? skillsAll : undefined;
    } else if (section === "projects") {
      filters.projects_keywords = proj.length ? proj : undefined;
    } else if (section === "phrasing") {
      filters.phrasing_keywords = phrasing.length ? phrasing : undefined;
    }
    return {
      mode: "filters",
      section,
      filters,
      prompt: prompt?.trim() ? prompt.trim() : undefined,
    };
  }, [
    section,
    role,
    location,
    includeRelated,
    minExp,
    maxExp,
    education,
    skillsAny,
    skillsAll,
    proj,
    phrasing,
    prompt,
  ]);

  // ids for labels
  const promptId = useMemo(() => uid("prompt"), []);
  const locationId = useMemo(() => uid("location"), []);

  // ----- Render nothing when closed -----
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Flyout card */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl rounded-2xl border border-border bg-card text-foreground shadow-2xl page-aurora"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm rounded-t-2xl border-b border-border px-5 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                <i className="ri-filter-3-line" />
              </div>
              <div>
                <div className="text-lg font-semibold">Filters</div>
                <div className="text-xs text-muted-foreground">
                  Card/flyout UI aligned with History → Re-run Prompt
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn h-9 w-9"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content (scrollable) */}
        <div className="max-h-[85vh] overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Manual prompt (optional) */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <label htmlFor={promptId} className="text-sm font-medium text-muted-foreground">
              Optional prompt (will refine results inside the chosen section)
            </label>
            <textarea
              id={promptId}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Strong React + TypeScript with GraphQL; fintech domain preferred'"
              className="mt-2 h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Section selector */}
          <div className="rounded-xl border border-border p-1 bg-muted">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {sections.map((s) => {
                const active = section === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-background text-primary shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={active}
                    title={s.hint}
                  >
                    <i className={s.icon} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Common options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <label htmlFor={locationId} className="text-sm font-medium text-muted-foreground">
                Location (optional)
              </label>
              <input
                id={locationId}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Remote, Karachi, Berlin"
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="related-roles"
                  type="checkbox"
                  checked={includeRelated}
                  onChange={(e) => setIncludeRelated(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="related-roles" className="text-sm">
                  Include related roles with % match
                </label>
              </div>
            </div>

            {/* Contextual helper */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium">Tips</div>
              <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                <li>• Choose a section first; search is scoped there for best precision.</li>
                <li>• Use the prompt box to add nuances (domain, seniority, stack).</li>
                <li>• Related roles show match % vs the ML-predicted role.</li>
              </ul>
            </div>
          </div>

          {/* Section-specific panels */}
          {section === "job_role" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium mb-2">Job Role</div>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Frontend Developer, Data Engineer"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                This targets the <span className="font-medium">Job Role</span> section only.
              </div>
            </div>
          )}

          {section === "experience" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium mb-3">Experience (years)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Min</label>
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(minExp!) ? String(minExp) : ""}
                    onChange={(e) => setMinExp(e.target.value === "" ? undefined : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max</label>
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(maxExp!) ? String(maxExp) : ""}
                    onChange={(e) => setMaxExp(e.target.value === "" ? undefined : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Targets the <span className="font-medium">Experience</span> section only.
              </div>
            </div>
          )}

          {section === "education" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium">Education</div>
              <div className="text-xs text-muted-foreground mb-2">
                Add degree names or certifications (press Enter to add).
              </div>
              <ChipsInput
                value={education}
                onChange={setEducation}
                placeholder="e.g., BSc Computer Science, MS CS, MBA"
                ariaLabel="Education chips"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {degreeSuggestions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEducation((v) => Array.from(new Set([...v, d])))}
                    className="px-3 py-1 rounded-full text-xs border border-border bg-muted hover:bg-muted/70"
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Targets the <span className="font-medium">Education</span> section only.
              </div>
            </div>
          )}

          {section === "skills" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              <div>
                <div className="text-sm font-medium">Skills (ANY)</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Candidates matching <span className="font-medium">any</span> of these skills.
                </div>
                <ChipsInput
                  value={skillsAny}
                  onChange={setSkillsAny}
                  placeholder="e.g., React, Node, Python"
                  ariaLabel="Skills any chips"
                />
              </div>
              <div>
                <div className="text-sm font-medium">Skills (ALL)</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Candidates that must have <span className="font-medium">all</span> of these skills.
                </div>
                <ChipsInput
                  value={skillsAll}
                  onChange={setSkillsAll}
                  placeholder="e.g., React, TypeScript"
                  ariaLabel="Skills all chips"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Targets the <span className="font-medium">Skills</span> section only.
              </div>
            </div>
          )}

          {section === "projects" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium">Project keywords</div>
              <div className="text-xs text-muted-foreground mb-2">
                Words/phrases that should appear in project descriptions.
              </div>
              <ChipsInput
                value={proj}
                onChange={setProj}
                placeholder="e.g., microservices, ETL, streaming"
                ariaLabel="Project keywords chips"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Targets the <span className="font-medium">Projects</span> section only.
              </div>
            </div>
          )}

          {section === "phrasing" && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium">CV phrasing keywords</div>
              <div className="text-xs text-muted-foreground mb-2">
                Words/phrases you expect to see in CV wording (e.g., “ownership”, “end-to-end”).
              </div>
              <ChipsInput
                value={phrasing}
                onChange={setPhrasing}
                placeholder="e.g., ownership, stakeholder management"
                ariaLabel="CV phrasing keywords chips"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Targets the <span className="font-medium">CV phrasing</span> section only.
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 z-10 bg-card/90 backdrop-blur-sm rounded-b-2xl border-t border-border px-5 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={resetAll}
              className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reset
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onApply(payload)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                disabled={Boolean(applying)}
                aria-busy={Boolean(applying)}
              >
                {applying ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/70 border-t-transparent animate-spin" />
                    Applying…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <i className="ri-check-line" />
                    Done
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
