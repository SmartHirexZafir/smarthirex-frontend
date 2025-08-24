'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

type ChatMsg = { id: number; type: 'bot' | 'user'; content: string; timestamp: string };

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

  const suggestedPrompts = [
    'Show me candidates with React + Django experience',
    'Find frontend developers with 3+ years experience',
    'Show Python developers in San Francisco',
    'Find candidates with Machine Learning skills',
    'Show full-stack developers with AWS experience',
    'Find UI/UX designers with Figma skills',
  ];

  const formatTime = () => new Date().toLocaleTimeString();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🔒 After mount, inject timestamp for any empty ones (prevents SSR/CSR mismatch)
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.timestamp ? m : { ...m, timestamp: formatTime() }))
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch(`${API_BASE}/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: 'You are not logged in or your session expired. Please log in again.',
            timestamp: formatTime(),
          },
        ]);
        onPromptSubmit(prompt, []);
        return;
      }

      const data = await response.json().catch(() => ({} as any));

      const botMessage: ChatMsg = {
        id: Date.now() + 2,
        type: 'bot',
        content: data.reply || 'Got it! Let me find some candidates for you.',
        timestamp: formatTime(),
      };

      setMessages((prev) => [...prev, botMessage]);
      onPromptSubmit(prompt, Array.isArray(data.resumes_preview) ? data.resumes_preview : []);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          type: 'bot',
          content: "Sorry, I couldn't process your request. Please try again later.",
          timestamp: formatTime(),
        },
      ]);
      onPromptSubmit(prompt, []);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section className="card-glass relative overflow-hidden animate-rise-in" aria-labelledby="ai-assistant-title">
      {/* Ambient overlays */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-gradient-to-r from-[hsl(var(--muted)/.5)] to-[hsl(var(--muted)/.35)] px-6 py-5">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] flex items-center justify-center text-white shadow-glow">
              <i className="ri-robot-line text-2xl" />
            </div>
            <div className="text-center">
              <h3 id="ai-assistant-title" className="text-2xl font-extrabold gradient-text glow">
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
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-300',
                  message.type === 'user'
                    ? 'text-white shadow-glow bg-gradient-to-r from-[hsl(var(--g1))] to-[hsl(var(--g3))]'
                    : 'surface glass border border-border text-foreground',
                ].join(' ')}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
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
        <div className="px-6 pb-4">
          <p className="mb-3 text-center text-sm text-[hsl(var(--muted-foreground))]">💡 Try these suggestions:</p>
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
        <div className="border-t border-border bg-gradient-to-r from-[hsl(var(--muted)/.4)] to-[hsl(var(--muted)/.25)] px-6 py-5">
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
    </section>
  );
}
