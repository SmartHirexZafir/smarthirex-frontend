'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

type ChatMsg = { id: number; type: 'bot' | 'user'; content: string; timestamp: string };

type ChatResultOk = { kind: 'ok'; data: any };
type ChatResultUnauth = { kind: 'unauth' };
type ChatResultError = { kind: 'error'; status?: number; message: string; data?: any };
type ChatResultNetwork = { kind: 'network'; message: string };

type ChatResult = ChatResultOk | ChatResultUnauth | ChatResultError | ChatResultNetwork;

/* ---------------------------
   Normalization (frontend)
---------------------------- */
const SYNONYMS: Record<string, string> = {
  // tech
  js: 'javascript',
  ts: 'typescript',
  reactjs: 'react',
  nodejs: 'node',
  'next.js': 'next',
  nextjs: 'next',
  py: 'python',
  tf: 'tensorflow',
  sklearn: 'scikit',
  'sk-learn': 'scikit',
  k8s: 'kubernetes',
  // roles/areas
  ml: 'machine learning',
  ai: 'artificial intelligence',
  cv: 'computer vision',
  nlp: 'natural language processing',
  fe: 'frontend',
  be: 'backend',
  fullstack: 'full-stack',
};

const PLURAL_SINGULAR: Record<string, string> = {
  developers: 'developer',
  engineers: 'engineer',
  scientists: 'scientist',
  designers: 'designer',
  managers: 'manager',
  analysts: 'analyst',
  architects: 'architect',
  candidates: 'candidate',
};

const STOPWORDS = new Set([
  'show',
  'find',
  'me',
  'with',
  'and',
  'in',
  'of',
  'for',
  'to',
  'a',
  'an',
  'the',
  'please',
  'pls',
  'candidate',
  'candidates',
  'experience',
  'years',
  'based',
  'developer',
  'developers',
  'engineer',
  'engineers',
  'scientist',
  'scientists',
  'designer',
  'designers',
  'manager',
  'managers',
]);

function normalizePrompt(raw: string) {
  let s = (raw || '').toLowerCase().trim().replace(/\s+/g, ' ');

  // plural -> singular
  for (const [pl, sg] of Object.entries(PLURAL_SINGULAR)) {
    s = s.replace(new RegExp(`\\b${pl}\\b`, 'g'), sg);
  }
  // synonyms
  for (const [k, v] of Object.entries(SYNONYMS)) {
    s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }

  const cleaned = s.replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleaned.split(' ').filter(Boolean);
  const keywords: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!STOPWORDS.has(t) && !seen.has(t)) {
      seen.add(t);
      keywords.push(t);
    }
  }
  const isRoleLike = cleaned.split(' ').length <= 4;
  return { normalized_prompt: s, keywords, isRoleLike };
}

export default function ChatbotSection({
  onPromptSubmit,
  isProcessing,
  activePrompt,
}: {
  onPromptSubmit: (prompt: string, candidates: any[]) => void;
  isProcessing: boolean;
  activePrompt: string;
}) {
  // 🚫 SSR timestamp avoided: start with empty timestamp, fill on client
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 1,
      type: 'bot',
      content:
        "Hi! I'm your AI recruiting assistant. Try asking me something like 'Show me candidates with React and Django experience'",
      timestamp: '', // <-- no timestamp on the server
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔔 lightweight in-component toast (auto hides in 3s)
  const [toast, setToast] = useState<{ show: boolean; msg: string; tone: 'info' | 'warning' | 'success' | 'error' }>(
    { show: false, msg: '', tone: 'info' }
  );

  useEffect(() => {
    if (!toast.show) return;
    const t = window.setTimeout(() => setToast({ show: false, msg: '', tone: 'info' }), 3000);
    return () => window.clearTimeout(t);
  }, [toast.show]);

  const suggestedPrompts = [
    'Show me candidates with React + Django experience',
    'Find frontend developer with 3+ years experience',
    'Show Python developer in San Francisco',
    'Find candidates with Machine Learning skills',
    'Show full-stack developer with AWS experience',
    'Find UI/UX designer with Figma skills',
  ];

  const formatTime = () => new Date().toLocaleTimeString();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🔒 After mount, inject timestamp for any empty ones (prevents SSR/CSR mismatch)
  useEffect(() => {
    setMessages((prev) => prev.map((m) => (m.timestamp ? m : { ...m, timestamp: formatTime() })));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ---- helpers --------------------------------------------------------------

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

  async function callChatbot(prompt: string, token: string | null): Promise<ChatResult> {
    // client-side normalization (aligned with backend)
    const norm = normalizePrompt(prompt);
    const payload = {
      prompt,
      normalized_prompt: norm.normalized_prompt,
      keywords: norm.keywords,
    };

    // try these in order; continue on 404/network
    const paths = ['/chatbot/query', '/query'];
    for (const p of paths) {
      try {
        const url = `${API_BASE}${p}`;
        const resp = await postJSON(url, payload, token);
        const status = resp.status;

        if (status === 401) {
          return { kind: 'unauth' };
        }

        // Read text first so we can safely JSON-parse (even if empty)
        const text = await resp.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null; // invalid JSON → treat as plain text
        }

        if (!resp.ok) {
          // On 404, try next path silently
          if (status === 404) continue;

          const message =
            (data && (data.detail || data.message)) ||
            (text && text.trim()) ||
            `Request failed (${status})`;
          return { kind: 'error', status, message, data };
        }

        // OK
        return { kind: 'ok', data: data ?? {} };
      } catch (_e) {
        // network error → try next path
        continue;
      }
    }

    // If we reach here, all attempts failed due to 404s or network
    return { kind: 'network', message: 'Network error or endpoint not reachable' };
  }

  // --------------------------------------------------------------------------

  const handleSubmit = async (prompt = inputValue.trim()) => {
    if (!prompt) return;

    const userMessage: ChatMsg = {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: formatTime(), // client-only
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // ✅ Immediately clear old candidates & show loader in parent
    onPromptSubmit(prompt, []); // START — loader ON

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const result = await callChatbot(prompt, token);

    // handle result types (no throwing → no blank "{}" console errors)
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
      onPromptSubmit(prompt, []); // FINISH — loader OFF
      setIsTyping(false);
      return;
    }

    if (result.kind === 'network') {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: 'bot',
          content:
            "Sorry, I couldn't reach the server. Please check your API URL or CORS settings.",
          timestamp: formatTime(),
        },
      ]);
      setToast({ show: true, msg: result.message, tone: 'error' });
      onPromptSubmit(prompt, []); // FINISH — loader OFF
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
      onPromptSubmit(prompt, []); // FINISH — loader OFF
      setIsTyping(false);
      return;
    }

    // kind === 'ok'
    const data = result.data || {};

    // ✅ Handle special case: no CV uploaded — also finish loader
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
      onPromptSubmit(prompt, []); // FINISH — loader OFF
      setIsTyping(false);
      return;
    }

    // --- Build standardized reply ---
    const list = Array.isArray(data.resumes_preview) ? data.resumes_preview : [];
    const total = typeof data?.matchMeta?.total === 'number' ? data.matchMeta.total : list.length;
    const q = (data?.normalized_prompt || prompt || '').toString().trim();

    const standardizedReply =
      `Showing ${total} result${total === 1 ? '' : 's'} for your query.` +
      (q ? `\nQuery: "${q}"` : '');

    const botMessage: ChatMsg = {
      id: Date.now() + 5,
      type: 'bot',
      content: standardizedReply,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, botMessage]);

    // 🔕 Inform on zero results as well, but DO finish the loader
    if (data?.no_results === true || total === 0) {
      setToast({ show: true, msg: 'No matching candidates found for your query.', tone: 'info' });
      try {
        window.dispatchEvent(new CustomEvent('shx:no-results', { detail: { prompt } }));
      } catch {}
      onPromptSubmit(prompt, []); // FINISH — loader OFF (empty results)
      setIsTyping(false);
      return;
    }

    // ✅ Deliver fresh results to parent (FINISH — loader OFF via parent)
    onPromptSubmit(prompt, list);
    setIsTyping(false);
  };

  return (
    <section
      className="card-glass relative overflow-hidden animate-rise-in"
      aria-labelledby="ai-assistant-title"
    >
      {/* Ambient overlays */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-gradient-to-r from-[hsl(var(--muted)/.5)] to-[hsl(var(--muted)/.35)] px-6 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] flex items-center justify-center text-white shadow-glow">
              <i className="ri-robot-line text-2xl" />
            </div>
            <div className="text-center">
              <h3 id="ai-assistant-title" className="text-2xl md:text-3xl font-extrabold gradient-text glow">
                AI Assistant
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Ask me to find specific candidates for your needs
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          </div>
        </header>

        {/* Messages */}
        <div
          className="px-6 py-6 space-y-4 max-h-96 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
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

        {/* Suggested Prompts */}
        <div className="px-6 pb-5">
          <p className="mb-3 text-center text-sm text-[hsl(var(--muted-foreground))]">
            💡 Try these suggestions:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedPrompts.slice(0, 4).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(prompt)}
                className="surface glass border border-border rounded-full px-4 py-2 text-sm text-foreground hover:shadow-glow transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-gradient-to-r from-[hsl(var(--muted)/.4)] to-[hsl(var(--muted)/.25)] px-6 py-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask me to find candidates..."
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
        </div>
      </div>

      {/* Toast (auto-hide in 3s) */}
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
