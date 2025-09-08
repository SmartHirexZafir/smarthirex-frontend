// app/test/[token]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import TestReady, {
  StartResponse as ReadyStartResponse,
} from "@/app/test/Components/TestReady";

import TestRunner, {
  type Question as RunnerQuestion,
  type SubmitResponse as RunnerSubmitResponse,
} from "@/app/test/Components/TestRunner";

import TestResult from "@/app/test/Components/TestResult";
import ProctorGuard from "@/app/test/Components/ProctorGuard";

type SubmitResponse = RunnerSubmitResponse;
type Question = RunnerQuestion;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000";

export default function TestTokenPage() {
  const params = useParams();
  const router = useRouter();
  const tokenParam = params?.token;
  const token = useMemo(
    () => (Array.isArray(tokenParam) ? tokenParam[0] : String(tokenParam || "")),
    [tokenParam]
  );

  const [step, setStep] = useState<"ready" | "running" | "result">("ready");
  const [apiError, setApiError] = useState<string | null>(null);

  const [testId, setTestId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  // From TestReady -> move into running step
  const handleStarted = (data: ReadyStartResponse) => {
    setTestId(data.test_id);
    setCandidateId(data.candidate_id);
    setQuestions((data.questions || []) as Question[]);
    setApiError(null);
    setStep("running");
  };

  function resetAndExit() {
    // Legacy navigation (used only if you explicitly enable allowSiteBack in TestResult)
    if (candidateId) {
      router.push(`/candidate/${candidateId}`);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">SmartHirex Assessment</h1>
        {testId && <span className="text-xs text-muted-foreground">Test ID: {testId}</span>}
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiError}
        </div>
      )}

      {/* Step: Ready */}
      {step === "ready" && (
        <TestReady
          token={token}
          onStarted={handleStarted}
          onCancel={() => router.push("/")}
          onError={(m) => setApiError(m)}
          apiBase={API_BASE}
        />
      )}

      {/* Step: Running */}
      {step === "running" && (
        <>
          {/* Camera proctoring floating preview + heartbeats/snapshots */}
          <ProctorGuard
            apiBase={API_BASE}
            testId={testId}
            candidateId={candidateId}
            token={token}
            heartbeatIntervalSec={20}
            snapshotIntervalSec={30}
            enableSnapshots={true}
            showPreview={true}
            previewWidth={220}
            position="bottom-right"
            // Low-impact deterrent enabled; fullscreen remains off to avoid disruption
            showWatermark={true}
          />

          <TestRunner
            token={token}
            questions={questions}
            apiBase={API_BASE}
            onSubmitted={(data) => {
              setResult(data);
              setStep("result");
            }}
            onCancel={resetAndExit}
            onError={(m) => setApiError(m)}
          />
        </>
      )}

      {/* Step: Result */}
      {step === "result" && result && (
        <TestResult
          result={result}
          onBack={resetAndExit}
          // Critical: do NOT navigate back to the site after submit
          allowSiteBack={false}
        />
      )}
    </div>
  );
}
