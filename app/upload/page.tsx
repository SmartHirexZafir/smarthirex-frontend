'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activePrompt, setActivePrompt] = useState<string>('Show all available candidates');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Tracks the prompt currently being fulfilled (prevents stale updates)
  const pendingPromptRef = useRef<string>('');

  useEffect(() => {
    // reserved for future init
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

      // START or FINISH(0 results)
      if (!Array.isArray(results) || results.length === 0) {
        const isStart = !isProcessing || pendingPromptRef.current !== incomingPrompt;

        if (isStart) {
          // START: update active prompt only here to avoid flicker on stale FINISH calls
          setActivePrompt(incomingPrompt);
          setCandidates([]);            // clear immediately
          setIsProcessing(true);        // show loader
          pendingPromptRef.current = incomingPrompt;
        } else {
          // FINISH with zero results for the current prompt
          setCandidates([]);            // ensure empty
          setIsProcessing(false);       // hide loader
          pendingPromptRef.current = ''; // clear token
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

  // ✅ Only show results section when we’re loading OR we actually have results
  const showResults = isProcessing || (Array.isArray(candidates) && candidates.length > 0);

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
