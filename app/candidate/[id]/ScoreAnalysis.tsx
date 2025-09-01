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

  return (
    <div className="panel glass gradient-border p-4">
      <h3 className="text-lg font-semibold mb-3">Score &amp; Analysis</h3>

      {/* Assessment Score = average(Match Score, Test Score) */}
      <div className="mb-4 rounded-xl ring-1 ring-inset ring-border bg-card/70 p-3 backdrop-blur-md shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-bar-chart-line text-[hsl(var(--info))]" aria-hidden />
            <span className="text-sm font-medium">Assessment Score</span>
            <span className="text-xs text-muted-foreground">(avg of Match + Test)</span>
          </div>
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
              isNum(assessment)
                ? "bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))] ring-1 ring-[hsl(var(--success)/0.35)]"
                : "bg-muted text-muted-foreground ring-1 ring-border",
            ].join(" ")}
            title="Average of Match Score and Test Score"
          >
            {isNum(assessment) ? `${assessment}%` : "N/A"}
          </span>
        </div>

        {/* Tiny context row (keeps UI tidy, no extra functionality) */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="badge">Match: {isNum(match) ? `${match}%` : "N/A"}</span>
          <span className="badge">Test: {isNum(test) ? `${test}%` : "N/A"}</span>
        </div>
      </div>

      {/* Skills Overview (dynamic; Technical Skills removed elsewhere) */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Skills Overview</span>
          <span className="text-xs text-muted-foreground">
            {matched.length}/{skills.length || 0} matched
          </span>
        </div>
      </div>

      {/* Compact pills always; more details when detailed=true */}
      <div className="flex flex-wrap gap-2">
        {skills.slice(0, detailed ? skills.length : 10).map((skill, i) => {
          const isMatch = matched.includes(skill);
          return (
            <span
              key={`${skill}-${i}`}
              className={[
                "badge",
                isMatch
                  ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] ring-[hsl(var(--success)/0.35)]"
                  : "bg-muted text-foreground/80 ring-border",
              ].join(" ")}
              aria-label={`Skill: ${skill}${isMatch ? " (matched)" : ""}`}
              title={isMatch ? "Matched for this role" : undefined}
            >
              {skill}
              {isMatch && <i className="ri-check-line ml-1" aria-hidden />}
            </span>
          );
        })}
        {skills.length > 10 && !detailed && (
          <span className="text-xs text-muted-foreground">+{skills.length - 10} more</span>
        )}
      </div>

      {/* Extra section only when detailed view is active (tab = Analysis) */}
      {detailed && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-inset ring-border">
            <div className="mb-1 flex items-center gap-2">
              <i className="ri-compass-3-line text-foreground/80" aria-hidden />
              <span className="text-sm font-medium">Observations</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Assessment is computed as the average of Match Score and Test Score. Skills are
              extracted dynamically from the candidate&rsquo;s resume and highlighted when matched
              to the target role.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
