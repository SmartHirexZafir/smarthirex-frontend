// smarthirex-frontend-main/app/history/RerunPromptModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildCompositePrompt,
  getEffectiveSelectedFromValues,
  splitCSV,
  type FilterKey,
} from '@/app/upload/ChatbotSection';

type HistoryItem = {
  id?: string;
  prompt?: string;
  totalMatches?: number;
  timestamp?: string;
  [key: string]: any;
};

type Candidate = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  skills?: string[];
  matchReasons?: string[];
  // optional scoring fields (if backend returns them)
  final_score?: number | string;
  prompt_matching_score?: number | string;
  match_score?: number | string;
  score?: number | string;
};

type Props = {
  history: HistoryItem;
  onClose: () => void;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

export default function RerunPromptModal({ history, onClose }: Props) {
  const [processing, setProcessing] = useState(false);

  // Filters state (reuse fields used elsewhere; prompt input removed per Req. 7)
  const [roleInput, setRoleInput] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');
  const [educationInput, setEducationInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [projectsInput, setProjectsInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [phrasesInclude, setPhrasesInclude] = useState('');
  const [phrasesExclude, setPhrasesExclude] = useState('');
  const [phrasesExact, setPhrasesExact] = useState('');

  // Optional visual toggles for which filters are "active"
  const [selected, setSelected] = useState<FilterKey[]>([]);

  // Results + selection
  const [results, setResults] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string; tone: 'info' | 'warning' | 'success' | 'error' }>({
    show: false,
    msg: '',
    tone: 'info',
  });

  const historyId = useMemo(
    () => (history?.id || (history as any)?._id || '').toString(),
    [history]
  );
  const originalPrompt = history?.prompt || '';

  useEffect(() => {
    if (!toast.show) return;
    const t = window.setTimeout(() => setToast({ show: false, msg: '', tone: 'info' }), 3200);
    return () => window.clearTimeout(t);
  }, [toast.show]);

  const toggleFilter = (k: FilterKey) => {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  // Build payload for backend based on current filters
  const buildFilterPayload = () => {
    const filterState = {
      roleInput,
      expMin,
      expMax,
      educationInput,
      skillsInput,
      projectsInput,
      locationInput,
      phrasesInclude,
      phrasesExclude,
      phrasesExact,
    };

    const selectedFilters = getEffectiveSelectedFromValues(filterState);
    const composite = buildCompositePrompt(filterState);

    const options: Record<string, any> = {};
    const exactTerms = splitCSV(phrasesExact);
    if (exactTerms.length) {
      options.exact_match_only = true;
      options.exact_terms = exactTerms;
    }

    return {
      // purely filters based (no model/chatbot free-prompt query per Req. 7)
      filters: {
        role: roleInput || undefined,
        expMin: expMin || undefined,
        expMax: expMax || undefined,
        education: educationInput || undefined,
        skills: skillsInput || undefined,
        projects: projectsInput || undefined,
        location: locationInput || undefined,
        phrasesInclude: phrasesInclude || undefined,
        phrasesExclude: phrasesExclude || undefined,
        phrasesExact: phrasesExact || undefined,
        composite, // human-readable summary (optional for backend logs)
      },
      selectedFilters,
      options,
    };
  };

  // Apply filters → fetch results (use same filtering app as elsewhere; no chatbot calls)
  const applyFilters = async () => {
    if (!historyId) return;
    setProcessing(true);
    setResults([]);
    setSelectedIds(new Set());

    try {
      // Using existing history rerun endpoint to submit filters (backend to handle accordingly)
      const resp = await fetch(`${API_BASE}/history/rerun/${historyId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildFilterPayload()),
      });

      const text = await resp.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!resp.ok) {
        setToast({ show: true, tone: 'error', msg: (data?.detail || data?.message || 'Failed to apply filters') as string });
        return;
      }

      const list: Candidate[] = Array.isArray(data?.candidates)
        ? data.candidates
        : Array.isArray(data?.resumes_preview)
        ? data.resumes_preview
        : [];

      setResults(list);
      if (list.length === 0) {
        setToast({ show: true, tone: 'info', msg: 'No results found for these filters.' });
      }
    } catch {
      setToast({ show: true, tone: 'error', msg: 'Network error while applying filters.' });
    } finally {
      setProcessing(false);
    }
  };

  const saveSelection = async () => {
    if (!historyId) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setToast({ show: true, tone: 'warning', msg: 'Please select at least one result to save.' });
      return;
    }

    setProcessing(true);
    try {
      const resp = await fetch(`${API_BASE}/history/rerun/${historyId}/save-selection`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ selectedIds: ids }),
      });

      const text = await resp.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!resp.ok) {
        setToast({ show: true, tone: 'error', msg: (data?.detail || data?.message || 'Failed to save selection') as string });
        return;
      }

      setToast({ show: true, tone: 'success', msg: 'Selection saved successfully.' });
    } catch {
      setToast({ show: true, tone: 'error', msg: 'Network error while saving selection.' });
    } finally {
      setProcessing(false);
    }
  };

  const stopBgScroll = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
  };

  const modal = (
    <>
      {/* Backdrop (blocks scroll without locking body) */}
      <div
        className="fixed inset-0 z-overlay bg-[hsl(var(--background)/.7)] backdrop-blur-sm"
        aria-hidden="true"
        onWheel={stopBgScroll}
        onTouchMove={stopBgScroll}
      />

      {/* Modal container */}
      <div
        className="fixed-center z-modal p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Re-run Prompt"
        onWheel={stopBgScroll}
        onTouchMove={stopBgScroll}
      >
        <div className="relative flex flex-col w-[95vw] sm:w-[85vw] lg:w-[80vw] max-w-[56rem] max-h-[92vh] rounded-2xl bg-card text-card-foreground border border-border shadow-2xl gradient-border">
          {/* Header - Fixed */}
          <div className="relative p-6 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold gradient-text">Re-run (Filters Only)</h2>
                {originalPrompt ? (
                  <p className="text-xs text-muted-foreground/90 mt-1 break-words">
                    <i className="ri-message-2-line mr-1" /> Original: "{originalPrompt}"
                  </p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="btn btn-ghost rounded-full h-10 w-10 shrink-0"
                aria-label="Close re-run modal"
                title="Close"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* Body: Filters only (no free prompt) - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
            {/* Filters toggle row */}
            <div>
              <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">Filters</div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'role', label: 'Job Role', icon: 'ri-id-card-line' },
                    { key: 'skills', label: 'Skills', icon: 'ri-star-line' },
                    { key: 'location', label: 'Location', icon: 'ri-map-pin-2-line' },
                    { key: 'projects', label: 'Projects', icon: 'ri-folder-3-line' },
                    { key: 'experience', label: 'Experience', icon: 'ri-briefcase-2-line' },
                    { key: 'education', label: 'Education', icon: 'ri-graduation-cap-line' },
                    { key: 'phrases', label: 'Phrases', icon: 'ri-double-quotes-l' },
                  ] as { key: FilterKey; label: string; icon: string }[]
                ).map((f) => {
                  const checked = selected.includes(f.key);
                  return (
                    <label
                      key={f.key}
                      className={[
                        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer select-none',
                        checked
                          ? 'bg-[hsl(var(--primary)/.12)] border-[hsl(var(--primary))] text-foreground shadow-glow'
                          : 'bg-transparent border-border text-foreground',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleFilter(f.key)}
                      />
                      <span
                        className={[
                          'h-4 w-4 rounded-[6px] border flex items-center justify-center',
                          checked
                            ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white'
                            : 'bg-transparent border-border text-transparent',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        <i className="ri-check-line text-[12px]" />
                      </span>
                      <i className={`${f.icon} text-[hsl(var(--muted-foreground))]`} />
                      <span className="text-sm">{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter fields */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Role */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Role</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder="e.g., Data Scientist"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    aria-label="Role input"
                  />
                </div>

                {/* Experience (Min / Max) */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Experience</label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input
                      className="input h-11 rounded-xl"
                      placeholder="Min years"
                      value={expMin}
                      onChange={(e) => setExpMin(e.target.value)}
                      aria-label="Minimum years of experience"
                    />
                    <input
                      className="input h-11 rounded-xl"
                      placeholder="Max years"
                      value={expMax}
                      onChange={(e) => setExpMax(e.target.value)}
                      aria-label="Maximum years of experience"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Skills (comma separated)</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder="python, django, react"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    aria-label="Skills input"
                  />
                </div>

                {/* Location */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Location</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder="e.g., Bangalore"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    aria-label="Location input"
                  />
                </div>

                {/* Education */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Education</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder='e.g., "MIT", "IIT", "Stanford"'
                    value={educationInput}
                    onChange={(e) => setEducationInput(e.target.value)}
                    aria-label="Education input"
                  />
                </div>

                {/* Projects */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Projects</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder='e.g., "e-commerce", "microservices"'
                    value={projectsInput}
                    onChange={(e) => setProjectsInput(e.target.value)}
                    aria-label="Projects input"
                  />
                </div>

                {/* Phrases — include / exclude */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Phrases</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder={'must include (e.g., "microservices")'}
                    value={phrasesInclude}
                    onChange={(e) => setPhrasesInclude(e.target.value)}
                    aria-label="Phrases include input"
                  />
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder={'exclude (e.g., "internship only")'}
                    value={phrasesExclude}
                    onChange={(e) => setPhrasesExclude(e.target.value)}
                    aria-label="Phrases exclude input"
                  />
                </div>

                {/* Exact phrase match */}
                <div className="panel p-3">
                  <label className="text-xs font-semibold text-muted-foreground">Exact phrase match</label>
                  <input
                    className="input mt-2 h-11 rounded-xl"
                    placeholder="custom exact phrases (comma sep)"
                    value={phrasesExact}
                    onChange={(e) => setPhrasesExact(e.target.value)}
                    aria-label="Exact phrase input"
                  />
                </div>
              </div>

              {/* Apply */}
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={applyFilters}
                  disabled={processing}
                  className="btn btn-primary"
                  aria-label="Apply filters"
                >
                  {processing ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--primary-foreground))/0.7] border-b-transparent" />
                      Applying…
                    </span>
                  ) : (
                    <>
                      <i className="ri-filter-3-line" />
                      Apply Filters
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results viewport */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Results</h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{results.length} found</span>
              </div>

              {results.length === 0 ? (
                <div className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))] border border-dashed border-border rounded-2xl">
                  No results yet. Adjust filters and click <span className="font-medium">Apply Filters</span>.
                </div>
              ) : (
                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                  {results.map((c) => {
                    const cid = (c._id || c.id || '').toString();
                    const checked = selectedIds.has(cid);
                    return (
                      <div
                        key={cid}
                        className={[
                          'rounded-2xl p-4 border bg-card transition',
                          checked
                            ? 'border-[hsl(var(--primary)/.45)] ring-1 ring-[hsl(var(--primary)/.25)] shadow-glow'
                            : 'border-border hover:border-[hsl(var(--border)/.9)]',
                        ].join(' ')}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-2 h-4 w-4 rounded border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                            checked={checked}
                            onChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (checked) next.delete(cid);
                                else next.add(cid);
                                return next;
                              });
                            }}
                            aria-label={`Select ${c.name}`}
                          />
                          <img
                            src={c.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${c.name || 'U'}`}
                            alt={c.name || 'Candidate'}
                            className="h-12 w-12 rounded-full object-cover border border-border shadow-soft"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold truncate">{c.name || 'Unknown'}</h4>
                                {c.email ? (
                                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                                ) : null}
                              </div>
                            </div>
                            {Array.isArray(c.skills) && c.skills.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.skills.slice(0, 10).map((s, i) => (
                                  <span key={i} className="chip text-xs">{String(s)}</span>
                                ))}
                                {c.skills.length > 10 && (
                                  <span className="chip text-xs opacity-60">+{c.skills.length - 10} more</span>
                                )}
                              </div>
                            ) : null}
                            {Array.isArray(c.matchReasons) && c.matchReasons.length > 0 ? (
                              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-1">
                                {c.matchReasons.slice(0, 3).map((r, idx) => (
                                  <li key={idx}>{r}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="px-6 py-4 border-t border-border bg-card shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground whitespace-nowrap">{selectedIds.size} selected</p>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={onClose} className="btn btn-outline text-sm shrink-0">
                  Close
                </button>
                <button onClick={saveSelection} disabled={processing || selectedIds.size === 0} className="btn btn-primary text-sm shrink-0">
                  {processing ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--primary-foreground))/0.7] border-b-transparent" />
                      Saving…
                    </span>
                  ) : (
                    <>
                      <i className="ri-save-3-line" />
                      Save selected
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 rounded-xl px-5 py-4 shadow-xl border text-base font-medium',
            toast.tone === 'success'
              ? 'bg-[hsl(var(--success))] text-white border-transparent'
              : toast.tone === 'warning'
              ? 'bg-[hsl(var(--warning))] text-black border-black/10'
              : toast.tone === 'error'
              ? 'bg-[hsl(var(--destructive))] text-white border-transparent'
              : 'bg-[hsl(var(--muted))] text-foreground border-border',
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <i
              className={
                toast.tone === 'success'
                  ? 'ri-check-line text-xl'
                  : toast.tone === 'warning'
                  ? 'ri-alert-line text-xl'
                  : toast.tone === 'error'
                  ? 'ri-close-circle-line text-xl'
                  : 'ri-information-line text-xl'
              }
            />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(modal, document.body);
}
