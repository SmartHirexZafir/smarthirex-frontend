// app/candidate/[id]/CandidateDetail.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CandidateProfile from "./CandidateProfile";
import ResumePreview from "./ResumePreview";
import ActionButtons from "./ActionButtons";
import ScoreAnalysis from "./ScoreAnalysis";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000";

export default function CandidateDetail({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "analysis" | "history">("profile");

  const mountedAtRef = useRef<number>(Date.now()); // for short-lived polling
  const pollingIdRef = useRef<number | null>(null);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/candidate/${candidateId}`, {
        // help bypass any intermediate caching; we want fresh score if it just changed
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch candidate");
      setCandidate(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  // initial load
  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // live auto-refresh (short window) to catch score updates soon after a test submission
  useEffect(() => {
    // poll every 15s for up to 3 minutes after mount
    const POLL_MS = 15000;
    const MAX_MS = 3 * 60 * 1000;

    function shouldPollNow() {
      return Date.now() - mountedAtRef.current < MAX_MS;
    }

    if (pollingIdRef.current) {
      window.clearInterval(pollingIdRef.current);
      pollingIdRef.current = null;
    }

    // Start polling if within the live window
    if (shouldPollNow()) {
      pollingIdRef.current = window.setInterval(() => {
        if (!shouldPollNow()) {
          if (pollingIdRef.current) {
            window.clearInterval(pollingIdRef.current);
            pollingIdRef.current = null;
          }
          return;
        }
        // If we don't have a score or it's 0, or user is on analysis tab, try to refresh
        const score = Number(candidate?.test_score ?? 0);
        if (!candidate || !Number.isFinite(score) || score === 0 || activeTab === "analysis") {
          fetchCandidate();
        }
      }, POLL_MS) as any;
    }

    return () => {
      if (pollingIdRef.current) {
        window.clearInterval(pollingIdRef.current);
        pollingIdRef.current = null;
      }
    };
  }, [candidate?.test_score, activeTab, fetchCandidate]);

  // refresh when the tab becomes visible / regains focus (common after test completion)
  useEffect(() => {
    const onFocusOrVisible = () => {
      // quick refresh to pick up any just-submitted score
      fetchCandidate();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocusOrVisible();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchCandidate]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/candidate/${candidateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update status");
      }

      setCandidate((prev: any) => ({
        ...prev,
        status: newStatus,
      }));
    } catch (err: any) {
      alert(err.message || "Status update failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <i className="ri-user-line text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 text-lg">{error || "Candidate not found"}</p>
          <Link href="/upload" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  const category = candidate.category || candidate.predicted_role || "Unknown";
  const confidence = candidate.confidence !== undefined ? `${candidate.confidence}%` : "N/A";
  const matchReason =
    candidate.match_reason === "Prompt filtered" ? "Filtered by prompt" : "ML classified";

  // fresh test score from backend (tests/submit updates parsed_resumes.test_score)
  const testScore =
    typeof candidate.test_score === "number" && Number.isFinite(candidate.test_score)
      ? Math.round(candidate.test_score)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/upload" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
                <p className="text-gray-600">Detailed view and assessment</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-wrap justify-end">
              {candidate.rank > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  <i className="ri-medal-line mr-2"></i>
                  Rank #{candidate.rank}
                </div>
              )}
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-briefcase-line mr-1"></i>
                {category}
              </div>
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-flashlight-line mr-1"></i>
                {confidence}
              </div>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-compass-3-line mr-1"></i>
                {matchReason}
              </div>

              {/* NEW: visible test score chip when present */}
              {testScore !== null && (
                <div
                  className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
                  title="Latest assessment score (MCQ percent)"
                >
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  Score: {testScore}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-4">
            <CandidateProfile candidate={candidate} />
            {/* ActionButtons keeps the same props; after actions (like Send Test), you can call fetchCandidate() to refresh */}
            <ActionButtons
              candidate={candidate}
              onStatusChange={handleStatusChange}
            />
            <ScoreAnalysis candidate={candidate} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-md rounded-t-2xl border border-gray-200/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: "profile", label: "Resume", icon: "ri-file-text-line" },
                    { id: "analysis", label: "Analysis", icon: "ri-bar-chart-line" },
                    { id: "history", label: "History", icon: "ri-history-line" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      <i className={`${tab.icon} mr-2`}></i>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Quick manual refresh (useful right after a test) */}
                <button
                  onClick={fetchCandidate}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                  title="Refresh candidate"
                >
                  <i className="ri-refresh-line mr-1" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-b-2xl border-x border-b border-gray-200/50">
              {activeTab === "profile" && <ResumePreview candidate={candidate} />}
              {activeTab === "analysis" && <ScoreAnalysis candidate={candidate} detailed />}

              {activeTab === "history" && (
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Interaction History</h3>
                    <button
                      onClick={fetchCandidate}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                      title="Refresh history"
                    >
                      <i className="ri-refresh-line mr-1" />
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <i className="ri-eye-line text-blue-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Profile viewed</p>
                        <p className="text-xs text-gray-500">Just now</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <i className="ri-upload-line text-green-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Resume uploaded</p>
                        <p className="text-xs text-gray-500">From database</p>
                      </div>
                    </div>
                    {/* You can append dynamic items from history API here later */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
