// app/candidate/[id]/ScoreAnalysis.tsx
"use client";

import React from "react";

/* ===================== Types ===================== */
type Candidate = {
  // Scores (backend snake_case + frontend camelCase)
  test_score?: number;
  testScore?: number;

  // Optional metadata we may show in analysis
  score?: number;
  matchedSkills?: string[];
  skills?: string[];

  // Anything else we might read but won't rely on strictly
  [k: string]: any;
};

/* Helper: normalize score to a 0-100 integer if available */
function normalizePercentScore(candidate?: Candidate): number | null {
  if (!candidate) return null;
  const s1 = candidate.test_score;
  const s2 = candidate.testScore;
  const v =
    typeof s1 === "number" && Number.isFinite(s1)
      ? s1
      : typeof s2 === "number" && Number.isFinite(s2)
      ? s2
      : undefined;
  return typeof v === "number" ? Math.round(v) : null;
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

  const scorePercent = normalizePercentScore(candidate);
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const matched = Array.isArray(candidate.matchedSkills) ? candidate.matchedSkills : [];

  return (
    <div className="panel glass gradient-border p-4">
      <h3 className="text-lg font-semibold mb-3">Score &amp; Analysis</h3>

      {/* Assessment Score */}
      <div className="mb-4 rounded-xl ring-1 ring-inset ring-border bg-card/70 p-3 backdrop-blur-md shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-bar-chart-line text-[hsl(var(--info))]" aria-hidden />
            <span className="text-sm font-medium">Assessment Score</span>
          </div>
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
              typeof scorePercent === "number"
                ? "bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))] ring-1 ring-[hsl(var(--success)/0.35)]"
                : "bg-muted text-muted-foreground ring-1 ring-border",
            ].join(" ")}
            title="Latest assessment score from backend"
          >
            {typeof scorePercent === "number" ? `${scorePercent}%` : "N/A"}
          </span>
        </div>
      </div>

      {/* Skills Summary */}
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
                "rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                isMatch
                  ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] ring-[hsl(var(--success)/0.35)]"
                  : "bg-muted text-foreground/80 ring-border",
              ].join(" ")}
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
              This section highlights the candidate’s current score and matched skills. Use it to
              decide next steps (shortlist / interview / send test). No backend logic changed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
