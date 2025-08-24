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
      {/* 👇 Global AppHeader is rendered by RootLayout; no page-local nav here */}

      <main id="main" className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">
        <UploadSection onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} />

        <section className="animate-rise-in">
          <ChatbotSection
            onPromptSubmit={handlePromptSubmit}
            isProcessing={isProcessing}
            activePrompt={activePrompt}
          />
        </section>

        <section className="animate-rise-in">
          <CandidateResults
            candidates={candidates}
            isProcessing={isProcessing}
            activePrompt={activePrompt}
          />
        </section>
      </main>
    </div>
  );
}
