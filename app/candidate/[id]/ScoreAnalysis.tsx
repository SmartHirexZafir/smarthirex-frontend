// app/candidate/[id]/ScoreAnalysis.tsx
"use client";

import React from "react";

/* ===================== Types ===================== */
type Candidate = {
  // Scores from backend and/or frontend (may arrive as numbers or numeric strings)
  test_score?: number | string;     // backend snake_case
  testScore?: number | string;      // frontend camelCase
  match_score?: number | string;    // backend snake_case
  matchScore?: number | string;     // frontend camelCase
  score?: number | string;          // sometimes used as "match score"

  // Dynamic skills from backend
  skills?: string[];
  matchedSkills?: string[];

  [k: string]: any;
};

/* ---------- helpers ---------- */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const toNum = (v: unknown): number | null => {
  if (isNum(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return null;
};

/** normalize a percent score to integer 0–100 (or null) */
function normalizePct(v: unknown): number | null {
  const n = toNum(v);
  return n === null ? null : Math.round(n);
}

/** derive individual scores from various possible fields */
function getScores(candidate?: Candidate) {
  if (!candidate) return { match: null as number | null, test: null as number | null };

  // match score may be in score | match_score | matchScore
  const match =
    normalizePct(candidate.match_score) ??
    normalizePct(candidate.matchScore) ??
    normalizePct(candidate.score);

  // test score may be in test_score | testScore
  const test = normalizePct(candidate.test_score) ?? normalizePct(candidate.testScore);

  return { match, test };
}

/** compute assessment = average(match, test) when both exist; otherwise show N/A */
function getAssessmentScore(candidate?: Candidate): number | null {
  const { match, test } = getScores(candidate);
  if (isNum(match) && isNum(test)) return Math.round((match + test) / 2);
  // Requirement explicitly wants average of Match + Test; if one is missing, prefer N/A
  return null;
}

/* ===================== Component ===================== */
export default function ScoreAnalysis({
  candidate,
  detailed = false,
}: {
  candidate: Candidate;
  detailed?: boolean;
}) {
  if (!candidate) return null;

  const { match, test } = getScores(candidate);
  const assessment = getAssessmentScore(candidate);

  // dynamic skills from backend only (no hard-coding)
  const rawSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const matched = Array.isArray(candidate.matchedSkills) ? candidate.matchedSkills : [];

  // de-duplicate skills while keeping order
  const seen = new Set<string>();
  const skills = rawSkills.filter((s) => {
    if (typeof s !== "string") return false;
    const key = s.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // For detailed view (Analysis tab), use a different layout
  if (detailed) {
    return (
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-6 gradient-text">Score &amp; Analysis</h3>

        {/* Two-column layout: Scores on left, Skills on right */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Scores - Big and Prominent */}
          <div className="space-y-4">
            {/* Match Score - Big and Prominent */}
            <div className="rounded-2xl ring-2 ring-inset ring-border bg-card/80 p-6 backdrop-blur-md shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--info)/0.15)]">
                  <i className="ri-target-line text-2xl text-[hsl(var(--info))]" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Match Score</p>
                  <p className="text-3xl font-bold text-[hsl(var(--info))]">
                    {isNum(match) ? `${match}%` : "N/A"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on resume matching and role alignment
              </p>
            </div>

            {/* Test Score - Big and Prominent */}
            <div className="rounded-2xl ring-2 ring-inset ring-border bg-card/80 p-6 backdrop-blur-md shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--success)/0.15)]">
                  <i className="ri-file-list-3-line text-2xl text-[hsl(var(--success))]" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Score</p>
                  <p className="text-3xl font-bold text-[hsl(var(--success))]">
                    {isNum(test) ? `${test}%` : "N/A"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Assessment test performance
              </p>
            </div>

            {/* Assessment Score (if both exist) */}
            {isNum(assessment) && (
              <div className="rounded-2xl ring-2 ring-inset ring-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.08)] p-6 backdrop-blur-md shadow-soft">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--success)/0.2)]">
                    <i className="ri-bar-chart-line text-2xl text-[hsl(var(--success))]" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assessment Score</p>
                    <p className="text-3xl font-bold text-[hsl(var(--success))]">
                      {assessment}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Average of Match Score and Test Score
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Skills - Clean and Aligned */}
          <div className="space-y-4">
            <div className="rounded-2xl ring-2 ring-inset ring-border bg-card/80 p-6 backdrop-blur-md shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Skills Overview</h4>
                <span className="text-sm text-muted-foreground">
                  {matched.length}/{skills.length || 0} matched
                </span>
              </div>
              
              {/* Skills grid - clean and aligned */}
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => {
                  const isMatch = matched.includes(skill);
                  return (
                    <span
                      key={`${skill}-${i}`}
                      className={[
                        "badge text-sm px-3 py-1.5",
                        isMatch
                          ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] ring-1 ring-[hsl(var(--success)/0.35)]"
                          : "bg-muted text-foreground/80 ring-1 ring-border",
                      ].join(" ")}
                      aria-label={`Skill: ${skill}${isMatch ? " (matched)" : ""}`}
                      title={isMatch ? "Matched for this role" : undefined}
                    >
                      {skill}
                      {isMatch && <i className="ri-check-line ml-1.5" aria-hidden />}
                    </span>
                  );
                })}
                {skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </div>
            </div>

            {/* Observations */}
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-inset ring-border">
              <div className="mb-2 flex items-center gap-2">
                <i className="ri-information-line text-foreground/80" aria-hidden />
                <span className="text-sm font-medium">About These Scores</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Match Score reflects how well the candidate&rsquo;s resume aligns with the target role. 
                Test Score measures performance on assessment tests. Skills are extracted dynamically 
                from the candidate&rsquo;s resume and highlighted when matched to the target role.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-detailed view (should not be used anymore, but keeping for safety)
  return null;
}
