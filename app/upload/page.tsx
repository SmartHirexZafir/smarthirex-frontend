// app/upload/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import UploadSection from './UploadSection';
import ChatbotSection from './ChatbotSection';
import CandidateResults from './CandidateResults';

type RelatedRoleOld = { role: string; match?: number };
type RelatedRoleNew = { role: string; score?: number };

interface Candidate {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  score?: number;
  skills?: string[];
  skillsTruncated?: string[];
  skillsOverflowCount?: number;
  experience?: number | string;
  matchedSkills?: string[];
  location?: string;
  currentRole?: string;
  avatar?: string;
  match_score?: number;
  predicted_role?: string;
  category?: string;
  filter_skills?: string[];
  semantic_score?: number;
  final_score?: number;
  confidence?: number; // unified to number when normalizing below
  resume_url?: string;

  // Experience aliases
  total_experience_years?: number;
  years_of_experience?: number;
  experience_years?: number;
  yoe?: number;

  // Additive fields aligned with backend
  experience_display?: string;
  experience_rounded?: number;
  related_roles?: RelatedRoleOld[];
  relatedRoles?: RelatedRoleNew[];
  is_strict_match?: boolean;
  match_type?: 'exact' | 'close';
}

const STATE_STORAGE_KEY = 'shx_upload_page_state';

type SavedState = {
  candidates: Candidate[];
  activePrompt: string;
  timestamp: number;
};

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  
  // ✅ Fix hydration: Always start with same initial values (server and client must match)
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activePrompt, setActivePrompt] = useState<string>('Show all available candidates');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // ✅ Restore state from localStorage ONLY after mount (prevents hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        const now = Date.now();
        if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
          if (parsed.candidates && parsed.candidates.length > 0) {
            setCandidates(parsed.candidates);
          }
          if (parsed.activePrompt) {
            setActivePrompt(parsed.activePrompt);
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  // Tracks the prompt currently being fulfilled (prevents stale updates)
  const pendingPromptRef = useRef<string>('');

  // Backend base URL for logout call (Req. 2)
  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, ''),
    []
  );

  // Save state to localStorage whenever candidates or prompt changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const state: SavedState = {
        candidates,
        activePrompt,
        timestamp: Date.now(),
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }, [candidates, activePrompt]);

  // Clear saved state when component unmounts (user navigates away permanently)
  useEffect(() => {
    return () => {
      // Don't clear on unmount - keep state for navigation back
    };
  }, []);

  // ✅ Fix auto-scroll: Only scroll to top on mount, and prevent any scroll during hydration
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready, but prevent scroll during initial render
    if (typeof window !== 'undefined') {
      // Small delay to ensure page is fully rendered before scrolling
      const timeoutId = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  const handleFileUpload = useCallback((files: any[]) => {
    setUploadedFiles(files);
  }, []);

  /**
   * Contract with ChatbotSection:
   * - onPromptSubmit(prompt, []) is called at START (clear UI & show loader)
   * - onPromptSubmit(prompt, list) is called at FINISH when there are results
   * - onPromptSubmit(prompt, []) is also called at FINISH when there are zero results
   *
   * We distinguish START vs FINISH using (isProcessing, pendingPromptRef).
   * - START if !isProcessing OR the incoming prompt differs from pendingPromptRef
   * - FINISH (empty) if isProcessing AND incoming prompt equals pendingPromptRef
   */
  const handlePromptSubmit = useCallback(
    (prompt: string, results: any[] = []) => {
      const incomingPrompt = String(prompt || '').trim();

      // Zero-results guard: if this is FINISH for the current prompt, stop loader + broadcast
      if (!Array.isArray(results) || results.length === 0) {
        if (pendingPromptRef.current === incomingPrompt) {
          setCandidates([]);
          setIsProcessing(false);
          pendingPromptRef.current = '';
          // belt & suspenders: also notify the global loader
          window.dispatchEvent(new Event('shx:no-results'));
          return;
        }

        // START path (no results yet): begin processing current prompt
        const isStart = !isProcessing || pendingPromptRef.current !== incomingPrompt;
        if (isStart) {
          setActivePrompt(incomingPrompt);
          setCandidates([]);            // clear immediately
          setIsProcessing(true);        // show loader
          pendingPromptRef.current = incomingPrompt;
        }
        return;
      }

      // FINISH with results
      // Ignore stale payloads (results for an older prompt)
      if (pendingPromptRef.current && pendingPromptRef.current !== incomingPrompt) {
        return;
      }

      // Normalize result items minimally (id & confidence coercion)
      const normalized: Candidate[] = (results || []).map((r: any) => {
        const rawId = r?._id ?? r?.id;
        const idStr =
          typeof rawId === 'number' ? String(rawId) : typeof rawId === 'string' ? rawId : undefined;

        const c = r?.confidence;
        const confidence =
          typeof c === 'number'
            ? c
            : typeof c === 'string'
            ? (parseFloat(c) || 0)
            : undefined;

        return { ...r, id: idStr, confidence };
      });

      // Accept results
      // (activePrompt was set on START; do not change it here to avoid race-induced flicker)
      setCandidates(normalized);
      setIsProcessing(false);
      pendingPromptRef.current = '';
    },
    [isProcessing]
  );

  // ✅ Logout: call backend, clear cookies/storage, and broadcast navigation intent (Req. 2)
  const handleLogout = useCallback(async () => {
    try {
      // Best-effort server-side logout (use auth router endpoint for proper JWT revocation)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // ignore network errors; proceed with client-side cleanup
    } finally {
      // Clear auth cookie(s) commonly used by the app (e.g., "token")
      const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `token=; Path=/; Expires=${expire}; SameSite=Lax`;
      // Clear local/session storage keys used
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      try {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } catch {}

      // Notify any listeners that logout completed (navigation handled by whoever listens)
      window.dispatchEvent(new Event('shx:logged-out'));
      // Also perform a hard redirect to login to ensure no residual state
      window.location.replace('/login');
    }
  }, [API_BASE]);

  // Optional: listen for a global logout trigger so existing UI buttons can dispatch it (Req. 2)
  useEffect(() => {
    const onLogout = () => { void handleLogout(); };
    window.addEventListener('shx:logout', onLogout);
    return () => window.removeEventListener('shx:logout', onLogout);
  }, [handleLogout]);

  // ✅ Only show results section when we’re loading OR we actually have results
  const showResults = isProcessing || (Array.isArray(candidates) && candidates.length > 0);

  // (Req. 3) No auto-scroll behavior is present; ensure nothing triggers focus-based scrolling.
  // No additional changes needed for autoscroll beyond avoiding scrollTo/scrollIntoView.

  return (
    <div className="min-h-screen">
      <main id="main" className="pb-8">
        <section className="py-14 md:py-18">
          <div className="container max-w-7xl space-y-12">
            <div className="mx-auto w-full max-w-6xl">
              <UploadSection onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} />
            </div>

            <div className="mx-auto w-full max-w-6xl animate-rise-in rounded-3xl ring-1 ring-[hsl(var(--primary)/.45)] gradient-border shadow-glow bg-card/60 backdrop-blur-sm p-5 sm:p-7">
              <ChatbotSection
                onPromptSubmit={handlePromptSubmit}
                isProcessing={isProcessing}
                activePrompt={activePrompt}
              />
            </div>

            {showResults && (
              <div className="mx-auto w-full max-w-7xl animate-rise-in rounded-3xl ring-1 ring-[hsl(var(--primary)/.45)] gradient-border shadow-glow bg-card/60 backdrop-blur-sm p-5 sm:p-7">
                <CandidateResults
                  candidates={candidates}
                  isProcessing={isProcessing}
                  activePrompt={activePrompt}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
