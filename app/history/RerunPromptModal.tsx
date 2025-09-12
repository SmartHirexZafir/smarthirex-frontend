'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

const candidateId = (c: Candidate) => String(c._id || c.id || '');
const candidateName = (c: Candidate) => c.name || c.title || c.role || 'Unnamed';
const candidateScore = (c: Candidate) => {
  const raw = c.final_score ?? c.prompt_matching_score ?? c.score ?? c.match_score ?? 0;
  let s = Math.round(Number(raw) || 0);
  if (s < 0) s = 0;
  if (s > 100) s = 100;
  return s;
};
const scoreBadge = (s: number) => {
  if (s >= 90) return 'bg-[hsl(var(--success)/.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/.35)]';
  if (s >= 80) return 'bg-[hsl(var(--info)/.15)] text-[hsl(var(--info))] border-[hsl(var(--info)/.35)]';
  if (s >= 70) return 'bg-[hsl(var(--warning)/.18)] text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning)/.35)]';
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

  // Section inputs
  const [roleInput, setRoleInput] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');
  const [educationSchools, setEducationSchools] = useState('');
  const [educationDegrees, setEducationDegrees] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [projectsInput, setProjectsInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [phrasesInclude, setPhrasesInclude] = useState('');
  const [phrasesExclude, setPhrasesExclude] = useState('');
  const [phrasesExact, setPhrasesExact] = useState('');

  // Cosmetic checkboxes (kept for payload – unchanged behavior)
  const [chkRole, setChkRole] = useState(true);
  const [chkExperience, setChkExperience] = useState(false);
  const [chkSkills, setChkSkills] = useState(true);
  const [chkProjects, setChkProjects] = useState(false);
  const [chkLocation, setChkLocation] = useState(false);
  const [chkEducation, setChkEducation] = useState(false);
  const [chkPhrases, setChkPhrases] = useState(false);
  const [chkExact, setChkExact] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const historyId = history?.id || (history as any)?._id || '';
  const originalPrompt = history?.prompt || '';
  const originalCount = Number(history?.totalMatches || 0);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const intro: ChatMsg = {
      role: 'assistant',
      content: `You're re-running inside this block only.
+ Original prompt: “${originalPrompt}”.
+ Saved CVs in this block: ${originalCount}.`,
    };
    setMessages([intro]);
    textareaRef.current?.focus();
    setRoleInput(originalPrompt || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Derive selected filters from non-empty sections
  const selectedFilters = useMemo(() => {
    const arr: Array<'role' | 'skills' | 'location' | 'projects' | 'experience' | 'education' | 'phrases'> = [];
    if (roleInput.trim()) arr.push('role');
    if (skillsInput.trim()) arr.push('skills');
    if (locationInput.trim()) arr.push('location');
    if (projectsInput.trim()) arr.push('projects');
    if (expMin.trim() || expMax.trim()) arr.push('experience');
    if (educationSchools.trim() || educationDegrees.trim()) arr.push('education');
    if (phrasesInclude.trim() || phrasesExclude.trim() || phrasesExact.trim()) arr.push('phrases');
    return arr;
  }, [
    roleInput,
    skillsInput,
    locationInput,
    projectsInput,
    expMin,
    expMax,
    educationSchools,
    educationDegrees,
    phrasesInclude,
    phrasesExclude,
    phrasesExact,
  ]);

  // Build composite free prompt
  const buildCompositePrompt = () => {
    const parts: string[] = [];
    const free = input.trim();
    if (free) parts.push(free);
    if (roleInput.trim()) parts.push(`role: ${roleInput.trim()}`);
    if (expMin.trim() || expMax.trim()) {
      if (expMin.trim() && expMax.trim()) parts.push(`experience: between ${expMin.trim()} and ${expMax.trim()} years`);
      else if (expMin.trim()) parts.push(`experience: at least ${expMin.trim()} years`);
      else if (expMax.trim()) parts.push(`experience: at most ${expMax.trim()} years`);
    }
    if (skillsInput.trim()) parts.push(`skills: ${skillsInput.trim()}`);
    if (projectsInput.trim()) parts.push(`projects: ${projectsInput.trim()}`);
    if (locationInput.trim()) parts.push(`location: ${locationInput.trim()}`);
    if (educationSchools.trim() || educationDegrees.trim()) {
      const sch = educationSchools.trim() ? `schools: ${educationSchools.trim()}` : '';
      const deg = educationDegrees.trim() ? `degrees: ${educationDegrees.trim()}` : '';
      parts.push(`education: ${[sch, deg].filter(Boolean).join('; ')}`);
    }
    if (phrasesInclude.trim() || phrasesExclude.trim() || phrasesExact.trim()) {
      const inc = phrasesInclude.trim() ? `include: ${phrasesInclude.trim()}` : '';
      const exc = phrasesExclude.trim() ? `exclude: ${phrasesExclude.trim()}` : '';
      const exa = phrasesExact.trim() ? `exact: ${phrasesExact.trim()}` : '';
      parts.push(`phrases: ${[inc, exc, exa].filter(Boolean).join('; ')}`);
    }
    return parts.join(' | ');
  };

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      (input.trim() ||
        roleInput.trim() ||
        skillsInput.trim() ||
        locationInput.trim() ||
        projectsInput.trim() ||
        expMin.trim() ||
        expMax.trim() ||
        educationSchools.trim() ||
        educationDegrees.trim() ||
        phrasesInclude.trim() ||
        phrasesExclude.trim() ||
        phrasesExact.trim())
    );
  }, [
    submitting,
    input,
    roleInput,
    skillsInput,
    locationInput,
    projectsInput,
    expMin,
    expMax,
    educationSchools,
    educationDegrees,
    phrasesInclude,
    phrasesExclude,
    phrasesExact,
  ]);

  const postRerun = async (payload: any): Promise<RerunResponse> => {
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
    return (await res.json()) as RerunResponse;
  };

  const sendPrompt = async () => {
    if (!canSubmit || !historyId) return;
    setSubmitting(true);
    setError(null);

    const composed = buildCompositePrompt();
    setMessages((prev) => [...prev, { role: 'user', content: composed }]);
    setInput('');

    try {
      const payload: any = {
        prompt: composed,
        selectedFilters,
        options: { exact_phrases: phrasesExact.trim() || undefined },
      };
      const data = await postRerun(payload);

      const assistantMsg =
        data?.ui?.primaryMessage ||
        data?.reply ||
        (data?.no_results ? 'No candidates matched your refined criteria.' : 'Updated results.');
      const list = (Array.isArray(data?.resumes_preview) && data?.resumes_preview?.length
        ? data?.resumes_preview
        : Array.isArray(data?.candidates) && data?.candidates?.length
        ? data?.candidates
        : []) as Candidate[];

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMsg }]);
      setPreview(list.slice(0, 20));
      setUpdatedCount(
        typeof data?.totalMatches === 'number' ? data.totalMatches : data?.no_results ? 0 : list?.length ?? null
      );
    } catch (e: any) {
      const msg = e?.message?.includes('403')
        ? 'You do not have access to update this history block.'
        : e?.message?.includes('404')
        ? 'That history block was not found.'
        : 'Failed to re-run the prompt. Please try again.';
      setError(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong while updating results.' }]);
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const sendFocused = async (
    section: 'role' | 'experience' | 'education' | 'skills' | 'projects' | 'phrases' | 'location',
    value: string
  ) => {
    const v = (value || '').trim();
    if (!v || !historyId || submitting) return;

    setSubmitting(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: `${section.toUpperCase()}: "${v}"` }]);

    try {
      const payload = {
        prompt: v,
        selectedFilters,
        options: { focus_section: section, exact_phrases: phrasesExact.trim() || undefined },
      };
      const data = await postRerun(payload);

      const assistantMsg =
        data?.ui?.primaryMessage ||
        data?.reply ||
        (data?.no_results ? 'No candidates matched your refined criteria.' : 'Updated results.');
      const list = (Array.isArray(data?.resumes_preview) && data?.resumes_preview?.length
        ? data?.resumes_preview
        : Array.isArray(data?.candidates) && data?.candidates?.length
        ? data?.candidates
        : []) as Candidate[];

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMsg }]);
      setPreview(list.slice(0, 20));
      setUpdatedCount(
        typeof data?.totalMatches === 'number' ? data.totalMatches : data?.no_results ? 0 : list?.length ?? null
      );
    } catch (e: any) {
      const msg = e?.message?.includes('403')
        ? 'You do not have access to update this history block.'
        : e?.message?.includes('404')
        ? 'That history block was not found.'
        : 'Failed to re-run the prompt. Please try again.';
      setError(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong while updating results.' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const submitExperience = () => {
    const min = expMin.trim();
    const max = expMax.trim();
    if (!min && !max) return;
    if (min && max) return sendFocused('experience', `between ${min} and ${max} years`);
    if (min) return sendFocused('experience', `at least ${min} years`);
    if (max) return sendFocused('experience', `at most ${max} years`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      sendPrompt();
    }
  };

  const onSectionKey =
    (
      section: 'role' | 'experience' | 'education' | 'skills' | 'projects' | 'phrases' | 'location',
      val: string,
      _setVal: (s: string) => void
    ) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (section === 'experience') return submitExperience();
        sendFocused(section, val);
      }
    };

  const submitPhrasesInclude = () => {
    if (!phrasesInclude.trim()) return;
    const composed = phrasesExclude.trim()
      ? `include: ${phrasesInclude.trim()}, exclude: ${phrasesExclude.trim()}`
      : phrasesInclude.trim();
    sendFocused('phrases', composed);
  };

  const submitPhrasesExclude = () => {
    if (!phrasesExclude.trim()) return;
    const composed = phrasesInclude.trim()
      ? `include: ${phrasesInclude.trim()}, exclude: ${phrasesExclude.trim()}`
      : `exclude: ${phrasesExclude.trim()}`;
    sendFocused('phrases', composed);
  };

  // -------- Modal Markup --------
  const modal = (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483646 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/70 bg-card/90 backdrop-blur-md shadow-2xl shadow-glow gradient-border">
        {/* Header */}
        <div className="relative p-6 border-b border-border bg-card/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold gradient-text">Re-run Prompt (Scoped)</h2>
              <p className="text-xs text-muted-foreground">Only within this block — applies to the {originalCount} saved CVs.</p>
              <p className="text-xs text-muted-foreground/90 mt-1">
                <i className="ri-message-2-line mr-1" /> Original: “{originalPrompt}”
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost rounded-full h-10 w-10 shrink-0"
                aria-label="Filters"
                title="Filters"
              >
                <i className="ri-filter-3-line text-lg" />
              </button>
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

          {/* Section inputs */}
          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-h-[70vh] overflow-y-auto">
              {/* Col 1 */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkRole}
                      onChange={(e) => setChkRole(e.target.checked)}
                      aria-label="Enable Role filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Role</span>
                  </div>
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={onSectionKey('role', roleInput, setRoleInput)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Data Scientist"
                    aria-label="Role"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkPhrases}
                      onChange={(e) => setChkPhrases(e.target.checked)}
                      aria-label="Enable Phrases filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Phrases</span>
                  </div>
                  <input
                    type="text"
                    value={phrasesInclude}
                    onChange={(e) => setPhrasesInclude(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitPhrasesInclude();
                      }
                    }}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-2"
                    placeholder={'must include (e.g., "microservices")'}
                    aria-label="Include phrases"
                  />
                  <input
                    type="text"
                    value={phrasesExclude}
                    onChange={(e) => setPhrasesExclude(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitPhrasesExclude();
                      }
                    }}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder={'exclude (e.g., "internship only")'}
                    aria-label="Exclude phrases"
                  />
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkExperience}
                      onChange={(e) => setChkExperience(e.target.checked)}
                      aria-label="Enable Experience filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Experience</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={expMin}
                      onChange={(e) => setExpMin(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitExperience();
                        }
                      }}
                      className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Min years"
                      aria-label="Minimum years experience"
                    />
                    <input
                      type="text"
                      value={expMax}
                      onChange={(e) => setExpMax(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitExperience();
                        }
                      }}
                      className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Max years"
                      aria-label="Maximum years experience"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkExact}
                      onChange={(e) => setChkExact(e.target.checked)}
                      aria-label="Enable Exact phrase match"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Exact phrase match</span>
                  </div>
                  <input
                    type="text"
                    value={phrasesExact}
                    onChange={(e) => setPhrasesExact(e.target.value)}
                    onKeyDown={onSectionKey('phrases', phrasesExact, setPhrasesExact)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="custom exact phrases (comma sep)"
                    aria-label="Exact phrases"
                  />
                </div>
              </div>

              {/* Col 3 */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkSkills}
                      onChange={(e) => setChkSkills(e.target.checked)}
                      aria-label="Enable Skills filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Skills (comma separated)</span>
                  </div>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={onSectionKey('skills', skillsInput, setSkillsInput)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="python, django, react"
                    aria-label="Skills"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkLocation}
                      onChange={(e) => setChkLocation(e.target.checked)}
                      aria-label="Enable Location filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Location</span>
                  </div>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={onSectionKey('location', locationInput, setLocationInput)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g., Bangalore"
                    aria-label="Location"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkEducation}
                      onChange={(e) => setChkEducation(e.target.checked)}
                      aria-label="Enable Education filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Education</span>
                  </div>
                  <input
                    type="text"
                    value={educationSchools}
                    onChange={(e) => setEducationSchools(e.target.value)}
                    onKeyDown={onSectionKey('education', educationSchools, setEducationSchools)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-2"
                    placeholder="schools (comma separated)"
                    aria-label="Education schools"
                  />
                  <input
                    type="text"
                    value={educationDegrees}
                    onChange={(e) => setEducationDegrees(e.target.value)}
                    onKeyDown={onSectionKey('education', educationDegrees, setEducationDegrees)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="degrees (comma separated)"
                    aria-label="Education degrees"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={chkProjects}
                      onChange={(e) => setChkProjects(e.target.checked)}
                      aria-label="Enable Projects filter"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Projects</span>
                  </div>
                  <input
                    type="text"
                    value={projectsInput}
                    onChange={(e) => setProjectsInput(e.target.value)}
                    onKeyDown={onSectionKey('projects', projectsInput, setProjectsInput)}
                    className="input w-full h-11 rounded-xl bg-background/60 border border-border/70 px-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g., e-commerce, microservices"
                    aria-label="Projects"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Chat */}
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
                    placeholder="Ask me to refine… (free prompt). Use the section inputs above to target a specific field."
                    className="input w-full min-h-[44px] max-h-40 resize-y pr-12"
                    rows={2}
                    aria-label="Refine prompt for this block only"
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">⌘/Ctrl + Enter</div>
                </div>
                <button
                  onClick={sendPrompt}
                  disabled={!canSubmit}
                  className="btn btn-primary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Preview */}
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
                  {updatedCount === 0
                    ? 'No matching candidates found for your refinement.'
                    : 'Run a refinement to see updated candidates here. This preview only shows CVs from this saved block.'}
                </div>
              ) : (
                preview.map((c) => {
                  const id = candidateId(c);
                  const name = candidateName(c);
                  const s = candidateScore(c);
                  return (
                    <div key={id} className="border rounded-xl p-3 bg-card hover:border-[hsl(var(--border)/.9)] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          {c.email && <div className="text-xs text-muted-foreground truncate">{c.email}</div>}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${scoreBadge(s)}`}
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
              <button onClick={onClose} className="btn btn-outline text-sm">
                Close
              </button>
              <button onClick={onClose} className="btn btn-primary text-sm">
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
