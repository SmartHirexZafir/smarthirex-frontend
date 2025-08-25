"use client";

import { useState, useEffect } from "react";
import UploadSection from "./UploadSection";
import ChatbotSection from "./ChatbotSection";
import CandidateResults from "./CandidateResults";

interface Candidate {
  id: number;
  name: string;
  email: string;
  score: number;
  skills: string[];
  experience: string;
  matchedSkills: string[];
  location: string;
  currentRole: string;
  avatar: string;
  _id?: string;
  match_score?: number;
  predicted_role?: string;
  filter_skills?: string[];
  semantic_score?: number;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activePrompt, setActivePrompt] = useState<string>("Show all available candidates");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // any user init you had before can stay here if needed
  }, []);

  const handleFileUpload = (files: any[]) => setUploadedFiles(files);
  const handlePromptSubmit = (prompt: string, results: Candidate[] = []) => {
    setActivePrompt(prompt);
    setCandidates(results);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global AppHeader comes from RootLayout */}

      <main id="main">
        {/* Match History layout: centered container + constrained width */}
        <section className="py-12 md:py-16">
          <div className="container max-w-6xl space-y-10">
            {/* Upload area width similar to History cards */}
            <div className="mx-auto w-full max-w-5xl">
              <UploadSection onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} />
            </div>

            {/* Chatbot section — same ring/glow as upload */}
            <div className="mx-auto w-full max-w-5xl animate-rise-in rounded-3xl ring-1 ring-[hsl(var(--primary)/.45)] gradient-border shadow-glow bg-card/60 backdrop-blur-sm p-4 sm:p-6">
              <ChatbotSection
                onPromptSubmit={handlePromptSubmit}
                isProcessing={isProcessing}
                activePrompt={activePrompt}
              />
            </div>

            {/* Results — same ring/glow as upload */}
            <div className="mx-auto w-full max-w-6xl animate-rise-in rounded-3xl ring-1 ring-[hsl(var(--primary)/.45)] gradient-border shadow-glow bg-card/60 backdrop-blur-sm p-4 sm:p-6">
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
