"use client";

import { useState, useEffect, useCallback } from "react";
import UploadSection from "./UploadSection";
import ChatbotSection from "./ChatbotSection";
import CandidateResults from "./CandidateResults";

interface Candidate {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  score?: number;
  skills?: string[];
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
  confidence?: number;
  resume_url?: string;
  total_experience_years?: number;
  years_of_experience?: number;
  experience_years?: number;
  yoe?: number;
  related_roles?: { role: string; match?: number }[];
  is_strict_match?: boolean;
  match_type?: "exact" | "close";
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activePrompt, setActivePrompt] = useState<string>("Show all available candidates");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // any user init you had before can stay here if needed
  }, []);

  const handleFileUpload = useCallback((files: any[]) => {
    setUploadedFiles(files);
  }, []);

  // ✅ Robust start/finish detection
  const handlePromptSubmit = useCallback(
    (prompt: string, results: any[] = []) => {
      setActivePrompt(prompt);

      // results is an array in both cases; decide by current isProcessing:
      if (Array.isArray(results) && results.length === 0) {
        if (isProcessing) {
          // finish (empty)
          setCandidates([]);
          setIsProcessing(false);
        } else {
          // start
          setCandidates([]);
          setIsProcessing(true);
        }
        return;
      }

      // finish with some candidates
      const normalized: Candidate[] = (results || []).map((r: any) => {
        const rawId = r?._id ?? r?.id;
        const idStr = typeof rawId === "number" ? String(rawId) : rawId ?? undefined;
        return { ...r, id: idStr };
      });

      setCandidates(normalized);
      setIsProcessing(false);
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
