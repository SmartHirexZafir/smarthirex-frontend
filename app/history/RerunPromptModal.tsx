'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------- Types ---------- */
type Candidate = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  score?: number;
  match_score?: number;
  final_score?: number;
  prompt_matching_score?: number;
  title?: string;
  role?: string;
};

type HistoryItem = {
  id?: string;
  prompt?: string;
  totalMatches?: number;
  timestamp?: string;
  // any extra backend fields are fine
  [key: string]: any;
};

type RerunResponse = {
  reply?: string;
  resumes_preview?: Candidate[];
  candidates?: Candidate[];
  totalMatches?: number;
  matchMeta?: Record<string, any>;
  no_results?: boolean;
  ui?: { primaryMessage?: string; query?: string };
};

type Props = {
  history: HistoryItem;
  onClose: () => void;
};

/* ✅ Use NEXT_PUBLIC_API_BASE_URL with localhost fallback; strip trailing slashes */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(
  /\/+$/,
  ''
);

/* ---------- Helpers ---------- */
const candidateId = (c: Candidate) => String(c._id || c.id || '');
const candidateName = (c: Candidate) => c.name || c.title || c.role || 'Unnamed';
const candidateScore = (c: Candidate) => {
  const raw =
    c.final_score ??
    c.prompt_matching_score ??
    c.score ??
    c.match_score ??
    0;
  let s = Math.round(Number(raw) || 0);
  if (s < 0) s = 0;
  if (s > 100) s = 100;
  return s;
};
const scoreBadge = (s: number) => {
  if (s >= 90)
    return 'bg-[hsl(var(--success)/.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/.35)]';
  if (s >= 80)
    return 'bg-[hsl(var(--info)/.15)] text-[hsl(var(--info))] border-[hsl(var(--info)/.35)]';
  if (s >= 70)
    return 'bg-[hsl(var(--warning)/.18)] text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning)/.35)]';
  return 'bg-[hsl(var(--destructive)/.15)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/.35)]';
};

type ChatMsg = { role: 'assistant' | 'user'; content: string };

export default function RerunPromptModal({ history, onClose }: Props) {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [preview, setPreview] = useState<Candidate[]>([]);
  const [updatedCount, setUpdatedCount] = useState<number | null>(null);

  // 🔽 “Chatbot-like” filter controls (mirrors Upload Chatbot at a light level)
  const [showFilters, setShowFilters] = useState(false);
  const [enableRole, setEnableRole] = useState(true);
  const [enableExperience, setEnableExperience] = useState(true);
  const [enableSkills, setEnableSkills] = useState(true);
  const [enableProjects, setEnableProjects] = useState(false);
  const [enableLocation, setEnableLocation] = useState(false);
  const [enableEducation, setEnableEducation] = useState(false);
  const [enablePhrases, setEnablePhrases] = useState(false);

  const [role, setRole] = useState('');
  const [minYears, setMinYears] = useState<string>('');
  const [maxYears, setMaxYears] = useState<string>('');
  const [skills, setSkills] = useState<string>(''); // comma separated
  const [projectsRequired, setProjectsRequired] = useState(false);
  const [location, setLocation] = useState('');
  const [schools, setSchools] = useState<string>(''); // comma separated
  const [degrees, setDegrees] = useState<string>(''); // comma separated
  const [mustPhrases, setMustPhrases] = useState<string>(''); // comma or ; separated
  const [excludePhrases, setExcludePhrases] = useState<string>('');
  const [exactOnly, setExactOnly] = useState(false);
  const [exactTerms, setExactTerms] = useState<string>('');

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const historyId = history?.id || history?._id || '';
  const originalPrompt = history?.prompt || '';
  const originalCount = Number(history?.totalMatches || 0);

  useEffect(() => {
    // initial assistant message
    const intro: ChatMsg = {
      role: 'assistant',
      content:
        `You're re-running inside this block only.\n` +
        `Original prompt: “${originalPrompt}”.\n` +
        `Saved CVs in this block: ${originalCount}.`,
    };
    setMessages([intro]);
    // focus input
    textareaRef.current?.focus();
    // seed role field from original prompt (nice UX; no dependency on backend)
    setRole(originalPrompt || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId]);

  useEffect(() => {
    // auto-scroll chat area
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const canSubmit = useMemo(() => input.trim().length > 0 && !submitting, [input, submitting]);

  /** Build chatbot-like options payload (harmless if backend ignores it). */
  const buildOptions = () => {
    const selected: string[] = [];
    if (enableRole) selected.push('role');
    if (enableExperience) selected.push('experience');
    if (enableSkills) selected.push('skills');
    if (enableProjects) selected.push('projects');
    if (enableLocation) selected.push('location');
    if (enableEducation) selected.push('education');
    if (enablePhrases) selected.push('phrases');

    const toList = (s: string) =>
      s
        .split(/[,;]\s*|\s{2,}/g)
        .map((x) => x.trim())
        .filter(Boolean);

    const opts: any = {
      selected,
      role: role.trim() || undefined,
      min_years: minYears ? Number(minYears) : undefined,
      max_years: maxYears ? Number(maxYears) : undefined,
      skills: toList(skills.toLowerCase()),
      projects_required: projectsRequired || undefined,
      location: location.trim() || undefined,
      schools: toList(schools.toLowerCase()),
      degrees: toList(degrees.toLowerCase()),
      must_phrases: toList(mustPhrases),
      exclude_phrases: toList(excludePhrases),
      exact_match_only: exactOnly || undefined,
      exact_terms: exactTerms ? toList(exactTerms) : undefined,
      prefilter_role_regex: true,
    };

    // prune undefined to keep payload tidy
    Object.keys(opts).forEach((k) => {
      if (opts[k] === undefined || (Array.isArray(opts[k]) && opts[k].length === 0)) {
        delete opts[k];
      }
    });
    return opts;
  };

  const sendPrompt = async () => {
    if (!canSubmit || !historyId) return;
    setSubmitting(true);
    setError(null);

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');

    try {
      const payload: any = { prompt: userText };
      // Include filters (mirrors chatbot behavior). Backend may ignore gracefully.
      const options = buildOptions();
      if (Object.keys(options).length > 0) payload.options = options;

      const res = await fetch(`${API_BASE}/history/rerun/${historyId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const data = (await res.json()) as RerunResponse;
      const assistantMsg =
        data?.ui?.primaryMessage ||
        data?.reply ||
        (data?.no_results ? 'No candidates matched your refined criteria.' : 'Updated results.');

      // derive preview candidates (supports different backend shapes)
      const list = (Array.isArray(data?.resumes_preview) && data?.resumes_preview?.length
        ? data?.resumes_preview
        : Array.isArray(data?.candidates) && data?.candidates?.length
        ? data?.candidates
        : []) as Candidate[];

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMsg }]);
      setPreview(list.slice(0, 20)); // show up to 20 in the modal preview
      setUpdatedCount(typeof data?.totalMatches === 'number' ? data.totalMatches : list?.length ?? null);
    } catch (e: any) {
      const msg =
        e?.message?.includes('403')
          ? 'You do not have access to update this history block.'
          : e?.message?.includes('404')
          ? 'That history block was not found.'
          : 'Failed to re-run the prompt. Please try again.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong while updating results.' },
      ]);
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    /* ✅ Clean popup (no dark overlay) */
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-card text-card-foreground border border-border shadow-2xl gradient-border">
        {/* Header */}
        <div className="relative p-6 border-b border-border bg-card/80">
          <div className="absolute inset-0 -z-10 opacity-[.18] bg-[radial-gradient(900px_400px_at_-10%_-20%,hsl(var(--g1)/.5),transparent_60%),radial-gradient(800px_500px_at_120%_-20%,hsl(var(--g2)/.4),transparent_55%),radial-gradient(700px_700px_at_80%_120%,hsl(var(--g3)/.35),transparent_60%)]" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold gradient-text">Re-run Prompt (Scoped)</h2>
              <p className="text-sm text-muted-foreground truncate">
                Only within this block — applies to the {originalCount} saved CVs.
              </p>
              <p className="text-xs text-muted-foreground/90 mt-1">
                <i className="ri-message-2-line mr-1" />
                Original: “{originalPrompt}”
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* 🔘 Filters toggle (matches chatbot affordance) */}
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="btn-ghost rounded-full h-10 px-4 text-sm"
                aria-expanded={showFilters}
                aria-controls="scoped-filters"
              >
                <i className="ri-filter-3-line mr-1" />
                Filters
              </button>

              <button
                onClick={onClose}
                className="btn-ghost rounded-full h-10 w-10 shrink-0"
                aria-label="Close re-run modal"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* Collapsible filters panel */}
          {showFilters && (
            <div id="scoped-filters" className="mt-4 rounded-xl border border-border p-4 bg-card/70">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Role */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enableRole}
                      onChange={(e) => setEnableRole(e.target.checked)}
                    />
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input w-full"
                    placeholder="e.g., Python Developer"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enableExperience}
                      onChange={(e) => setEnableExperience(e.target.checked)}
                    />
                    Experience
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={minYears}
                      onChange={(e) => setMinYears(e.target.value)}
                      className="input w-full"
                      placeholder="Min years"
                    />
                    <input
                      type="number"
                      min={0}
                      value={maxYears}
                      onChange={(e) => setMaxYears(e.target.value)}
                      className="input w-full"
                      placeholder="Max years"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enableSkills}
                      onChange={(e) => setEnableSkills(e.target.checked)}
                    />
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="input w-full"
                    placeholder="python, django, react"
                  />
                </div>

                {/* Projects */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enableProjects}
                      onChange={(e) => setEnableProjects(e.target.checked)}
                    />
                    Projects
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={projectsRequired}
                      onChange={(e) => setProjectsRequired(e.target.checked)}
                    />
                    Must have projects
                  </label>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enableLocation}
                      onChange={(e) => setEnableLocation(e.target.checked)}
                    />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input w-full"
                    placeholder="e.g., Bangalore"
                  />
                </div>

                {/* Education */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enableEducation}
                      onChange={(e) => setEnableEducation(e.target.checked)}
                    />
                    Education
                  </label>
                  <input
                    type="text"
                    value={schools}
                    onChange={(e) => setSchools(e.target.value)}
                    className="input w-full"
                    placeholder="schools (comma separated)"
                  />
                  <input
                    type="text"
                    value={degrees}
                    onChange={(e) => setDegrees(e.target.value)}
                    className="input w-full"
                    placeholder="degrees (comma separated)"
                  />
                </div>

                {/* Phrases */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enablePhrases}
                      onChange={(e) => setEnablePhrases(e.target.checked)}
                    />
                    Phrases
                  </label>
                  <input
                    type="text"
                    value={mustPhrases}
                    onChange={(e) => setMustPhrases(e.target.value)}
                    className="input w-full"
                    placeholder='must include (e.g., "microservices", rest api)'
                  />
                  <input
                    type="text"
                    value={excludePhrases}
                    onChange={(e) => setExcludePhrases(e.target.value)}
                    className="input w-full"
                    placeholder='exclude (e.g., "internship only")'
                  />
                </div>

                {/* Exact match */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={exactOnly}
                      onChange={(e) => setExactOnly(e.target.checked)}
                    />
                    Exact phrase match
                  </label>
                  <input
                    type="text"
                    value={exactTerms}
                    onChange={(e) => setExactTerms(e.target.value)}
                    className="input w-full"
                    placeholder='custom exact phrases (comma separated)'
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  className="btn-ghost text-sm"
                  onClick={() => {
                    setEnableRole(true);
                    setEnableExperience(true);
                    setEnableSkills(true);
                    setEnableProjects(false);
                    setEnableLocation(false);
                    setEnableEducation(false);
                    setEnablePhrases(false);
                    setRole(originalPrompt || '');
                    setMinYears('');
                    setMaxYears('');
                    setSkills('');
                    setProjectsRequired(false);
                    setLocation('');
                    setSchools('');
                    setDegrees('');
                    setMustPhrases('');
                    setExcludePhrases('');
                    setExactOnly(false);
                    setExactTerms('');
                  }}
                >
                  <i className="ri-refresh-line mr-1" />
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Chat side */}
          <div className="flex flex-col h-[60vh]">
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-3 py-2 border ${
                    m.role === 'user'
                      ? 'ml-auto bg-[hsl(var(--primary)/.12)] border-[hsl(var(--primary)/.35)] text-[hsl(var(--primary))]'
                      : 'mr-auto bg-[hsl(var(--muted)/.5)] border-[hsl(var(--border))] text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              {error && (
                <div className="mr-auto max-w-[90%] md:max-w-[85%] rounded-2xl px-3 py-2 border bg-[hsl(var(--destructive)/.1)] border-[hsl(var(--destructive)/.35)] text-[hsl(var(--destructive))]">
                  <div className="text-sm">{error}</div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder='Ask me to refine… e.g. “Need 5+ years”, “Must know Django”, or use quotes for exact match'
                    className="input w-full min-h-[44px] max-h-40 resize-y pr-12"
                    rows={2}
                    aria-label="Refine prompt for this block only"
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">⌘/Ctrl + Enter</div>
                </div>
                <button
                  onClick={sendPrompt}
                  disabled={!canSubmit}
                  className="btn-primary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="inline-flex items-center">
                      <span className="w-4 h-4 mr-2 inline-block border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                      Running
                    </span>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-1" />
                      Run
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview side */}
          <div className="border-l border-border h-[60vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Preview in this block</h3>
                <div className="text-xs text-muted-foreground">
                  {updatedCount !== null ? (
                    <>
                      Updated to <span className="font-semibold">{updatedCount}</span> candidate
                      {updatedCount === 1 ? '' : 's'}
                    </>
                  ) : (
                    <>No updates yet</>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {preview.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Run a refinement to see updated candidates here. This preview only shows CVs from
                  this saved block.
                </div>
              ) : (
                preview.map((c) => {
                  const id = candidateId(c);
                  const name = candidateName(c);
                  const s = candidateScore(c);
                  return (
                    <div
                      key={id}
                      className="border rounded-xl p-3 bg-card/60 backdrop-blur-sm hover:border-[hsl(var(--border)/.9)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          {c.email && (
                            <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                          )}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${scoreBadge(
                            s
                          )}`}
                          aria-label={`Match score ${s}%`}
                        >
                          {s}% Match
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-border flex items-center justify-end gap-2">
              <button onClick={onClose} className="btn-outline text-sm">
                Close
              </button>
              <button onClick={onClose} className="btn-primary text-sm">
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
