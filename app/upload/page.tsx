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
  confidence?: number; // <-- unified (no string)
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

  // Track the prompt currently being fulfilled to avoid race conditions
  const pendingPromptRef = useRef<string>('');

  useEffect(() => {
    // reserved for future init
  }, []);

  const handleFileUpload = useCallback((files: any[]) => {
    setUploadedFiles(files);
  }, []);

  /**
   * Contract with ChatbotSection:
   * - onPromptSubmit(prompt, []) is called twice:
   *     1) at START to clear & show loader
   *     2) at FINISH when there are zero results (no-results/no-CV/error)
   * - onPromptSubmit(prompt, list) is called at FINISH when there are results
   */
  const handlePromptSubmit = useCallback(
    (prompt: string, results: any[] = []) => {
      const incomingPrompt = String(prompt || '').trim();
      setActivePrompt(incomingPrompt);

      if (!Array.isArray(results) || results.length === 0) {
        if (!isProcessing) {
          setCandidates([]);
          setIsProcessing(true);
          pendingPromptRef.current = incomingPrompt;
          return;
        }
        if (pendingPromptRef.current === incomingPrompt) {
          setCandidates([]);
          setIsProcessing(false);
          pendingPromptRef.current = '';
        }
        return;
      }

      if (pendingPromptRef.current && pendingPromptRef.current !== incomingPrompt) {
        // stale payload; ignore
        return;
      }

      const normalized: Candidate[] = (results || []).map((r: any) => {
        const rawId = r?._id ?? r?.id;
        const idStr =
          typeof rawId === 'number' ? String(rawId) : typeof rawId === 'string' ? rawId : undefined;

        // coerce confidence to number
        const c = r?.confidence;
        const confidence =
          typeof c === 'number'
            ? c
            : typeof c === 'string'
            ? (parseFloat(c) || 0)
            : undefined;

        return { ...r, id: idStr, confidence };
      });

      setCandidates(normalized);
      setIsProcessing(false);
      pendingPromptRef.current = '';
    },
    [isProcessing]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
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

            <div className="mx-auto w-full max-w-7xl animate-rise-in rounded-3xl ring-1 ring-[hsl(var(--primary)/.45)] gradient-border shadow-glow bg-card/60 backdrop-blur-sm p-5 sm:p-7">
              <CandidateResults
                candidates={candidates}
                isProcessing={isProcessing}
                activePrompt={activePrompt}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
