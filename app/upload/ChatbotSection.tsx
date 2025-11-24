// smarthirex-frontend-main/app/upload/ChatbotSection.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useGlobalLoading } from '@/components/system/GlobalLoadingProvider';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

type ChatMsg = { id: number; type: 'bot' | 'user'; content: string; timestamp: string };

type ChatResultOk = { kind: 'ok'; data: any };
type ChatResultUnauth = { kind: 'unauth' };
type ChatResultError = { kind: 'error'; status?: number; message: string; data?: any };
type ChatResultNetwork = { kind: 'network'; message: string };
type ChatResult = ChatResultOk | ChatResultUnauth | ChatResultError | ChatResultNetwork;

/* ---------------------------
   Filter menu (checkboxes)
---------------------------- */
export type FilterKey =
  | 'role'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'phrases'
  | 'location';

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'role',       label: 'Job Role',   icon: 'ri-id-card-line' },
  { key: 'skills',     label: 'Skills',     icon: 'ri-star-line' },
  { key: 'location',   label: 'Location',   icon: 'ri-map-pin-2-line' },
  { key: 'projects',   label: 'Projects',   icon: 'ri-folder-3-line' },
  { key: 'experience', label: 'Experience', icon: 'ri-briefcase-2-line' },
  { key: 'education',  label: 'Education',  icon: 'ri-graduation-cap-line' },
  { key: 'phrases',    label: 'Phrases',    icon: 'ri-double-quotes-l' },
];

/* ---------------------------
   Helpers (composite prompt)
---------------------------- */
export function splitCSV(s?: string) {
  return (s ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

// Non-empty sections → selectedFilters (AND semantics on backend)
export function getEffectiveSelectedFromValues(state: {
  roleInput?: string;
  expMin?: string | number;
  expMax?: string | number;
  educationInput?: string;
  skillsInput?: string;
  projectsInput?: string;
  locationInput?: string;
  phrasesInclude?: string;
  phrasesExclude?: string;
  phrasesExact?: string;
}): FilterKey[] {
  const keys = new Set<FilterKey>();
  if (state.roleInput?.trim()) keys.add('role');
  if (state.expMin || state.expMax) keys.add('experience');
  if (state.educationInput?.trim()) keys.add('education');
  if (state.skillsInput?.trim()) keys.add('skills');
  if (state.projectsInput?.trim()) keys.add('projects');
  if (state.locationInput?.trim()) keys.add('location');
  if (state.phrasesInclude?.trim() || state.phrasesExclude?.trim() || state.phrasesExact?.trim())
    keys.add('phrases');
  return Array.from(keys);
}

// Human-readable composite prompt from filled filter fields
export function buildCompositePrompt(state: {
  roleInput?: string;
  expMin?: string | number;
  expMax?: string | number;
  educationInput?: string;
  skillsInput?: string;
  projectsInput?: string;
  locationInput?: string;
  phrasesInclude?: string;
  phrasesExclude?: string;
  phrasesExact?: string;
}) {
  const parts: string[] = [];
  if (state.roleInput?.trim()) parts.push(`Role: ${state.roleInput.trim()}`);

  const hasMin = state.expMin !== undefined && String(state.expMin).trim() !== '';
  const hasMax = state.expMax !== undefined && String(state.expMax).trim() !== '';
  if (hasMin && hasMax) parts.push(`Experience: between ${state.expMin} and ${state.expMax} years`);
  else if (hasMin) parts.push(`Experience: at least ${state.expMin} years`);
  else if (hasMax) parts.push(`Experience: at most ${state.expMax} years`);

  if (state.educationInput?.trim()) parts.push(`Education: ${state.educationInput.trim()}`);
  if (state.skillsInput?.trim()) parts.push(`Skills: ${state.skillsInput.trim()}`);
  if (state.projectsInput?.trim()) parts.push(`Projects: ${state.projectsInput.trim()}`);
  if (state.locationInput?.trim()) parts.push(`Location: ${state.locationInput.trim()}`);

  if (state.phrasesInclude?.trim()) parts.push(`Must include "${state.phrasesInclude.trim()}"`);
  if (state.phrasesExclude?.trim()) parts.push(`Exclude "${state.phrasesExclude.trim()}"`);
  if (state.phrasesExact?.trim()) parts.push(`Exact terms: "${state.phrasesExact.trim()}"`);

  return parts.join('; ');
}

export default function ChatbotSection({
  onPromptSubmit,
  isProcessing,
  activePrompt,
  /** NEW: when true, do NOT call /chatbot/query internally; parent will handle submission */
  delegateToParent = false,
}: {
  onPromptSubmit: (prompt: string, candidates: any[]) => void;
  isProcessing: boolean;
  activePrompt: string;
  delegateToParent?: boolean; // ← minimal addition to avoid hard-wiring when embedding in History re-run
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 1,
      type: 'bot',
      content:
        "Hi! I'm your AI recruiting assistant. Type your query and choose filters below to control what is matched (e.g., Job Role + Experience).",
      timestamp: '',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selected, setSelected] = useState<FilterKey[]>([]); // UI-only; logic derives from filled fields
  const [showFilters, setShowFilters] = useState(false); // (Req. 4) toggle filters row
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drawer/section inputs (History-style)
  const [roleInput, setRoleInput] = useState('');

  // Experience min/max → composed prompt (between / at least / at most)
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');

  const [educationInput, setEducationInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [projectsInput, setProjectsInput] = useState('');

  // Location
  const [locationInput, setLocationInput] = useState('');

  // Phrases (include/exclude) + Exact phrase
  const [phrasesInclude, setPhrasesInclude] = useState('');
  const [phrasesExclude, setPhrasesExclude] = useState('');
  const [phrasesExact, setPhrasesExact] = useState('');

  // finish guard to always stop parent loader
  const finishedRef = useRef(false);

  // lightweight toast (unchanged UI block at bottom)
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    tone: 'info' | 'warning' | 'success' | 'error';
  }>({ show: false, msg: '', tone: 'info' });
  useEffect(() => {
    if (!toast.show) return;
    const t = window.setTimeout(() => setToast({ show: false, msg: '', tone: 'info' }), 3200);
    return () => window.clearTimeout(t);
  }, [toast.show]);

  const { trackPromise } = useGlobalLoading();

  const formatTime = () => new Date().toLocaleTimeString();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // ✅ Fix auto-scroll: Scroll only within messages container, not entire page
  const scrollToBottom = () => {
    // Only scroll the messages container, not the entire page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else if (messagesEndRef.current) {
      // Fallback: use scrollIntoView but with block: 'nearest' to prevent page scroll
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  
  const initialMountRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  
  // ✅ Fix hydration: Only set timestamps after mount to prevent server/client mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    // Set timestamps only after mount
    if (typeof window !== 'undefined') {
      setMessages((prev) => prev.map((m) => (m.timestamp ? m : { ...m, timestamp: formatTime() })));
    }
  }, []);
  
  // ✅ Fix auto-scroll: Only scroll when NEW messages are added (not on initial mount or restore)
  useEffect(() => {
    if (!isMounted) return;
    
    const currentCount = messages.length;
    const previousCount = lastMessageCountRef.current;
    
    // Only scroll if:
    // 1. Not the initial mount (initialMountRef.current === false)
    // 2. Message count actually increased (new message added)
    if (!initialMountRef.current && currentCount > previousCount) {
      scrollToBottom();
    }
    
    // Update refs
    lastMessageCountRef.current = currentCount;
    if (initialMountRef.current) {
      // Mark initial mount as complete after first render
      initialMountRef.current = false;
    }
  }, [messages, isMounted]);

  // Seed the prompt field when provided (for "Re-run Prompt" flow)
  // Also restore filter state from localStorage (only after mount to prevent hydration issues)
  useEffect(() => {
    if (!isMounted) return;
    
    if (activePrompt) setInputValue(activePrompt);
    
    // Restore filter state from localStorage (only after mount)
    try {
      const saved = localStorage.getItem('shx_chatbot_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roleInput) setRoleInput(parsed.roleInput);
        if (parsed.expMin) setExpMin(parsed.expMin);
        if (parsed.expMax) setExpMax(parsed.expMax);
        if (parsed.educationInput) setEducationInput(parsed.educationInput);
        if (parsed.skillsInput) setSkillsInput(parsed.skillsInput);
        if (parsed.projectsInput) setProjectsInput(parsed.projectsInput);
        if (parsed.locationInput) setLocationInput(parsed.locationInput);
        if (parsed.phrasesInclude) setPhrasesInclude(parsed.phrasesInclude);
        if (parsed.phrasesExclude) setPhrasesExclude(parsed.phrasesExclude);
        if (parsed.phrasesExact) setPhrasesExact(parsed.phrasesExact);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [activePrompt, isMounted]);

  // Save filter state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
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
      localStorage.setItem('shx_chatbot_filters', JSON.stringify(filterState));
    } catch (e) {
      // Ignore storage errors
    }
  }, [roleInput, expMin, expMax, educationInput, skillsInput, projectsInput, locationInput, phrasesInclude, phrasesExclude, phrasesExact]);

  // checkbox change (preserve selection order; remove on uncheck)
  const toggleFilter = (k: FilterKey) => {
    setSelected((prev) => {
      if (prev.includes(k)) return prev.filter((x) => x !== k);
      return [...prev, k];
    });
  };

  async function postJSON(url: string, body: any, token: string | null) {
    const resp = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return resp;
  }

  // Backend owns semantics. We pass: prompt + selectedFilters + (optional) strict options.
  async function callChatbot(
    payload: { prompt: string; selectedFilters?: FilterKey[]; options?: Record<string, any> },
    token: string | null
  ): Promise<ChatResult> {
    const paths = ['/chatbot/query', '/query'];
    for (const p of paths) {
      try {
        const url = `${API_BASE}${p}`;
        const body = {
          prompt: payload.prompt,
          selectedFilters: payload.selectedFilters ?? [],
          options: payload.options ?? {},
        };
        const resp = await postJSON(url, body, token);
        const status = resp.status;
        if (status === 401) return { kind: 'unauth' };
        const text = await resp.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }
        if (!resp.ok) {
          if (status === 404) continue;
          const message =
            (data && (data.detail || data.message)) || (text && text.trim()) || `Request failed (${status})`;
          return { kind: 'error', status, message, data };
        }
        return { kind: 'ok', data: data ?? {} };
      } catch {
        continue;
      }
    }
    return { kind: 'network', message: 'Network error or endpoint not reachable' };
  }

  const finishParent = (prompt: string, list: any[]) => {
    finishedRef.current = true;
    onPromptSubmit(prompt, list);
  };

  // Free-prompt submit
  const handleSubmit = async (prompt = inputValue.trim()) => {
    if (!prompt) return;

    finishedRef.current = false;

    const userMessage: ChatMsg = {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: formatTime(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // clear old candidates & show loader in parent
    onPromptSubmit(prompt, []); // START — loader ON

    // If we’re embedded (History re-run), delegate to parent and stop here.
    if (delegateToParent) {
      setIsTyping(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const result = await trackPromise(callChatbot({ prompt }, token));

      if (result.kind === 'unauth') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: 'You are not logged in or your session expired. Please log in again.',
            timestamp: formatTime(),
          },
        ]);
        finishParent(prompt, []); // FINISH — loader OFF
        setIsTyping(false);
        return;
      }
      if (result.kind === 'network') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: 'bot',
            content: "Sorry, I couldn't reach the server. Please check your API URL or CORS settings.",
            timestamp: formatTime(),
          },
        ]);
        setToast({ show: true, msg: result.message, tone: 'error' });
        finishParent(prompt, []); // FINISH — loader OFF
        setIsTyping(false);
        return;
      }
      if (result.kind === 'error') {
        const msg = result.message || `Server error (${result.status || 'unknown'})`;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 3,
            type: 'bot',
            content: `Sorry, I couldn't process your request: ${msg}`,
            timestamp: formatTime(),
          },
        ]);
        setToast({ show: true, msg: 'Server error while processing your request.', tone: 'error' });
        finishParent(prompt, []); // FINISH — loader OFF
        setIsTyping(false);
        return;
      }

      const data = result.data || {};
      if (data?.no_cvs_uploaded === true || data?.message === 'no_cvs_uploaded') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 4,
            type: 'bot',
            content: 'There is no CV uploaded from your side.',
            timestamp: formatTime(),
          },
        ]);
        try {
          window.dispatchEvent(new CustomEvent('shx:no-cvs', { detail: { prompt } }));
        } catch {}
        setToast({ show: true, msg: 'No CVs found. Please upload resumes first.', tone: 'warning' });
        finishParent(prompt, []); // FINISH — loader OFF
        setIsTyping(false);
        return;
      }

      const list = Array.isArray(data.resumes_preview) ? data.resumes_preview : [];
      const total = typeof data?.matchMeta?.total === 'number' ? data.matchMeta.total : list.length;
      const q = (data?.normalized_prompt || prompt || '').toString().trim();

      const standardizedReply =
        `Showing ${total} result${total === 1 ? '' : 's'} for your query.` + (q ? `\nQuery: "${q}"` : '');

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 5, type: 'bot', content: standardizedReply, timestamp: formatTime() },
      ]);

      if (data?.no_results === true || total === 0) {
        setToast({ show: true, msg: 'No matching candidates found for your query.', tone: 'info' });
        try {
          window.dispatchEvent(new CustomEvent('shx:no-results', { detail: { prompt } }));
        } catch {}
        finishParent(prompt, []); // FINISH — loader OFF (empty results)
        setIsTyping(false);
        return;
      }

      finishParent(prompt, list); // FINISH — loader OFF via parent
      setIsTyping(false);
    } finally {
      // Safety: ensure parent loader stops even if we missed a path
      if (!finishedRef.current) {
        onPromptSubmit(prompt, []);
        setIsTyping(false);
      }
    }
  };

  // Single Apply handler (composite prompt + derived selectedFilters)
  const handleApply = async () => {
    const promptInput = inputValue?.trim() ?? '';
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

    const composite = buildCompositePrompt(filterState);
    const finalPrompt = [promptInput, composite].filter(Boolean).join(' — ');

    if (!finalPrompt) {
      setToast({ show: true, tone: 'warning', msg: 'Koi field ya prompt fill karke Apply dabayein.' });
      return;
    }

    const selectedFilters = getEffectiveSelectedFromValues(filterState);

    const options: Record<string, any> = {};
    const exactTerms = splitCSV(phrasesExact);
    if (exactTerms.length) {
      options.exact_match_only = true;
      options.exact_terms = exactTerms;
    }

    finishedRef.current = false;

    // Add a compact user message for the composite search
    const userMessage: ChatMsg = {
      id: Date.now(),
      type: 'user',
      content: finalPrompt,
      timestamp: '',
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // start loader
    onPromptSubmit(finalPrompt, []); // START

    // If we’re embedded (History re-run), delegate to parent and stop here.
    if (delegateToParent) {
      setIsTyping(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const result = await trackPromise(
        callChatbot({ prompt: finalPrompt, selectedFilters, options }, token)
      );

      if (result.kind === 'unauth') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: 'You are not logged in or your session expired. Please log in again.',
            timestamp: formatTime(),
          },
        ]);
        finishParent(finalPrompt, []);
        setIsTyping(false);
        return;
      }
      if (result.kind === 'network') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: 'bot',
            content: "Sorry, I couldn't reach the server. Please check your API URL or CORS settings.",
            timestamp: formatTime(),
          },
        ]);
        setToast({ show: true, msg: result.message, tone: 'error' });
        finishParent(finalPrompt, []);
        setIsTyping(false);
        return;
      }
      if (result.kind === 'error') {
        const msg = result.message || `Server error (${result.status || 'unknown'})`;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 3,
            type: 'bot',
            content: `Sorry, I couldn't process your request: ${msg}`,
            timestamp: formatTime(),
          },
        ]);
        setToast({ show: true, msg: 'Server error while processing your request.', tone: 'error' });
        finishParent(finalPrompt, []);
        setIsTyping(false);
        return;
      }

      const data = result.data || {};
      if (data?.no_cvs_uploaded === true || data?.message === 'no_cvs_uploaded') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 4,
            type: 'bot',
            content: 'There is no CV uploaded from your side.',
            timestamp: formatTime(),
          },
        ]);
        try {
          window.dispatchEvent(new CustomEvent('shx:no-cvs', { detail: { prompt: finalPrompt } }));
        } catch {}
        setToast({ show: true, msg: 'No CVs found. Please upload resumes first.', tone: 'warning' });
        finishParent(finalPrompt, []);
        setIsTyping(false);
        return;
      }

      const list = Array.isArray(data.resumes_preview) ? data.resumes_preview : [];
      const total = typeof data?.matchMeta?.total === 'number' ? data.matchMeta.total : list.length;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 5,
          type: 'bot',
          content: `Showing ${total} result${total === 1 ? '' : 's'} for your query.`,
          timestamp: formatTime(),
        },
      ]);

      if (data?.no_results === true || total === 0) {
        setToast({ show: true, msg: 'No matching candidates found for your query.', tone: 'info' });
        try {
          window.dispatchEvent(new CustomEvent('shx:no-results', { detail: { prompt: finalPrompt } }));
        } catch {}
        finishParent(finalPrompt, []);
        setIsTyping(false);
        return;
      }

      finishParent(finalPrompt, list);
      setIsTyping(false);
    } finally {
      if (!finishedRef.current) {
        onPromptSubmit(finalPrompt, []);
        setIsTyping(false);
      }
    }
  };

  return (
    <section className="card-glass relative animate-rise-in" aria-labelledby="ai-assistant-title">
      {/* Ambient overlays */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-gradient-to-r from-[hsl(var(--muted)/.5)] to-[hsl(var(--muted)/.35)] px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] flex items-center justify-center text-white shadow-glow">
                <i className="ri-robot-line text-2xl" />
              </div>
              <div>
                <h3 id="ai-assistant-title" className="text-2xl md:text-3xl font-extrabold gradient-text glow">
                  AI Assistant
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Ask me to find specific candidates for your needs</p>
              </div>
            </div>

            {/* (Req. 4) Toggle Filters button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="btn btn-outline flex items-center gap-2"
                aria-pressed={showFilters}
                aria-controls="filters-row"
              >
                <i className="ri-filter-3-line" />
                Filters
                {selected.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white text-[10px] px-2 py-0.5">
                    {selected.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* (Req. 4) Filters row directly below the button */}
          {showFilters && (
            <div id="filters-row" className="mt-4">
              <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">Filters</div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
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
          )}

          {/* Guidance between filters and input panels */}
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            If you want to search using a prompt, please select filters and then search.
            If you want to search without a prompt, use the category input boxes instead.
          </p>
        </header>

        {/* History-style focused sections (scrollable panel; ENTER triggers Apply) */}
        <div className="px-6 pt-5 pb-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
              {/* Role */}
              <div className="panel p-3">
                <label className="text-xs font-semibold text-muted-foreground">Role</label>
                <input
                  className="input mt-2 h-11 rounded-xl"
                  placeholder="e.g., Data Scientist"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApply();
                    }}
                    aria-label="Minimum years of experience"
                  />
                  <input
                    className="input h-11 rounded-xl"
                    placeholder="Max years"
                    value={expMax}
                    onChange={(e) => setExpMax(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApply();
                    }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
                  aria-label="Phrases include input"
                />
                <input
                  className="input mt-2 h-11 rounded-xl"
                  placeholder={'exclude (e.g., "internship only")'}
                  value={phrasesExclude}
                  onChange={(e) => setPhrasesExclude(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
                  aria-label="Exact phrase input"
                />
              </div>
            </div>

            {/* Single Apply button */}
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={handleApply}
                disabled={isProcessing}
                data-testid="apply-filters"
                className="btn btn-primary"
                aria-label="Apply filters"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="px-6 py-6 space-y-4 max-h-96 overflow-y-auto" 
          role="log" 
          aria-live="polite" 
          aria-relevant="additions"
        >
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-300',
                  message.type === 'user'
                    ? 'text-white shadow-glow bg-gradient-to-r from-[hsl(var(--g1))] to-[hsl(var(--g3))]'
                    : 'surface glass border border-border text-foreground',
                ].join(' ')}
              >
                <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                  {message.content}
                </p>
                <time
                  className={`text-[10px] mt-2 ${
                    message.type === 'user' ? 'text-white/80' : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                  dateTime={message.timestamp || undefined}
                  suppressHydrationWarning
                >
                  {message.timestamp || ''}
                </time>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="surface glass border border-border px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Free Prompt Input */}
        <div className="border-t border-border bg-gradient-to-r from-[hsl(var(--muted)/.4)] to-[hsl(var(--muted)/.25)] px-6 py-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder='Ask me to find candidates… (type in a section above for focused search)'
              className="input glass flex-1"
              disabled={isProcessing}
              aria-label="Type a prompt to filter candidates"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isProcessing || !inputValue.trim()}
              className="btn btn-primary min-w-[60px] flex items-center justify-center disabled:opacity-60"
              aria-disabled={isProcessing || !inputValue.trim()}
              aria-label="Send prompt"
            >
              {isProcessing ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <i className="ri-send-plane-2-line text-lg" />
              )}
            </button>
          </div>
          {/* selected filter tags preview (visual only) */}
          {selected.length > 0 && (
            <div className="mt-3 overflow-x-auto px-2 md:px-3">
              <div className="flex gap-2 overflow-visible">
                {selected.map((k) => {
                  const f = FILTERS.find((x) => x.key === k)!;
                  return (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-xs text-foreground"
                    >
                      <i className={`${f.icon}`} /> {f.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast (auto-hide in ~3.2s) */}
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
    </section>
  );
}
