"use client";

import { useState, useEffect, useCallback } from "react";
import UploadSection from "./UploadSection";
import ChatbotSection from "./ChatbotSection";
import CandidateResults from "./CandidateResults";

interface Candidate {
  id?: string;                      // ✅ align with CandidateResults expectations
  _id?: string;
  name?: string;
  email?: string;
  score?: number;
  skills?: string[];
  experience?: number | string;     // backend may send number; we accept string too for safety
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
  // extra fields from backend (non-breaking)
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

  // --- Upload callback
  const handleFileUpload = useCallback((files: any[]) => {
    setUploadedFiles(files);
  }, []);

  // --- Backward-compatible prompt submit handler expected by ChatbotSection
  // ChatbotSection should call onPromptSubmit twice:
  //  1) start (likely with empty results) -> set loader ON and clear list
  //  2) finish (with results) -> set loader OFF and show results
  const handlePromptSubmit = useCallback((prompt: string, results: any[] = []) => {
    setActivePrompt(prompt);

    if (!results || results.length === 0) {
      // starting / loading
      setIsProcessing(true);
      setCandidates([]);
      return;
    }

    // finished -> normalize ids (number -> string) to satisfy CandidateResults typing
    const normalized: Candidate[] = results.map((r: any) => {
      const rawId = r?._id ?? r?.id;
      const idStr = typeof rawId === "number" ? String(rawId) : (rawId ?? undefined);
      return { ...r, id: idStr }; // keep _id as-is, ensure id?: string
    });

    setCandidates(normalized);
    setIsProcessing(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global AppHeader comes from RootLayout */}

      <main id="main" className="pb-8">
        {/* Centered page section with fuller spacing */}
        <section className="py-14 md:py-18">
          <div className="container max-w-7xl space-y-12">
            {/* Upload area — fuller width */}
            <div className="mx-auto w-full max-w-6xl">
              <UploadSection onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} />
            </div>

            {/* Chatbot section — elevated container */}
            <div className="mx-auto w-full max-w-6xl animate-rise-in rounded-3xl ring-1 ring-[hsl(var(--primary)/.45)] gradient-border shadow-glow bg-card/60 backdrop-blur-sm p-5 sm:p-7">
              <ChatbotSection
                onPromptSubmit={handlePromptSubmit}   // ✅ only props ChatbotSection declares
                isProcessing={isProcessing}
                activePrompt={activePrompt}
              />
            </div>

            {/* Results — elevated container */}
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
