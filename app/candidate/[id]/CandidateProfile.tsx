// app/candidate/[id]/CandidateProfile.tsx
"use client";

import { useMemo, useState } from "react";

type Candidate = {
  name?: string;
  avatar?: string;
  avatar_url?: string;          // backend alt
  currentRole?: string;
  company?: string;
  score?: number | string;      // Match score (0–100)
  testScore?: number | string;  // frontend camelCase
  test_score?: number | string; // backend snake_case
  years_experience?: number | string;    // preferred backend field
  experience_years?: number | string;    // alt spelling
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];            // (moved out of left rail per requirements)
  matchedSkills?: string[];
  job_role?: string;            // ✅ backend job role
  predicted_role?: string;      // ✅ ML label
  category?: string;            // ✅ fallback role/category
  resume?: { email?: string; workHistory?: unknown[] }; // optional nested email
};

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e5e7eb"/>
      <stop offset="1" stop-color="#f3f4f6"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#g)"/>
  <circle cx="64" cy="46" r="22" fill="#cbd5e1"/>
  <rect x="24" y="78" width="80" height="34" rx="17" fill="#cbd5e1"/>
</svg>`);

/** Derive initials like "Zafir Hassan" -> "ZH" */
function getInitials(name?: string) {
  if (!name) return "NA";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "NA";
}

/** Coerce numbers that might arrive as numeric strings from backend */
function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return undefined;
}

export default function CandidateProfile({ candidate }: { candidate: Candidate }) {
  if (!candidate) return null;

  const {
    name = "Unnamed Candidate",
    avatar,
    avatar_url,
    currentRole,
    company = "Not specified",
    score, // Match Score
    test_score,
    testScore: testScoreCamel,
    years_experience,
    experience_years,
    email,
    phone,
    location = "N/A",
    resume,
    job_role,
    predicted_role,
    category,
  } = candidate;

  // Prefer backend value; fall back to camelCase; accept numeric strings too
  const normalizedTestScore = num(test_score) ?? num(testScoreCamel);

  // Experience years: prefer dedicated numeric fields (accept numeric strings)
  const experienceYears = num(years_experience) ?? num(experience_years);

  const normalizedEmail = email || resume?.email || undefined;

  const fmtPct = (v?: number | string) => {
    const n = num(v);
    return typeof n === "number" ? `${Math.round(n)}%` : "—";
    };

  // ✅ ROLE: always show a concise job-role label, not a long description
  const rawRole =
    job_role ||
    predicted_role ||
    category ||
    (typeof currentRole === "string" ? currentRole : "") ||
    "";

  const cleanedRole = rawRole.replace(/\s+/g, " ").trim(); // squash line breaks / extra spaces
  const roleLabel =
    cleanedRole.length > 0
      ? cleanedRole.length > 48
        ? `${cleanedRole.slice(0, 48)}…`
        : cleanedRole
      : "N/A";

  // Avatar / initials fallback handling
  const [imgError, setImgError] = useState(false);
  const [triedDefault, setTriedDefault] = useState(false);

  const avatarSrc = useMemo(() => {
    const src = (avatar || avatar_url || "").trim();
    return src;
  }, [avatar, avatar_url]);

  const showImage = !!avatarSrc && !imgError;

  return (
    <div className="panel glass gradient-border relative overflow-hidden p-4 md:p-5">
      {/* header */}
      <div className="relative z-10">
        {/* Profile Header */}
        <div className="mb-4 text-center">
          <div className="relative mb-3 inline-block">
            {showImage ? (
              <img
                src={avatarSrc}
                alt={name}
                className="h-20 w-20 rounded-full ring-2 ring-background object-cover object-top shadow-lux"
                onError={(e) => {
                  // Try backend default avatar once; then fall back to inline SVG
                  const img = e.currentTarget as HTMLImageElement;
                  if (!triedDefault) {
                    setTriedDefault(true);
                    img.src = "/default-avatar.png";
                    return;
                  }
                  setImgError(true);
                  img.src = FALLBACK_SVG;
                }}
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full ring-2 ring-background shadow-lux bg-[hsl(var(--muted)/.6)] flex items-center justify-center"
                aria-label={`${name} initials`}
              >
                <span className="text-xl font-semibold text-foreground">{getInitials(name)}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-success shadow-glow">
              <i className="ri-check-line text-xs text-[hsl(var(--success-foreground))]" aria-hidden />
            </div>
          </div>
          <h2 className="mb-1 text-xl font-bold">{name}</h2>

          {/* ✅ Single-line concise role (Data Scientist, Frontend Engineer, etc.) */}
          <p
            className="mb-1 text-sm font-medium text-[hsl(var(--info))] truncate max-w-[240px] mx-auto"
            title={cleanedRole || "N/A"}
          >
            {roleLabel}
          </p>

          <p className="text-xs text-muted-foreground">{company}</p>
        </div>

        {/* Quick Stats: Experience, Match Score, Test Score (only if present) */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Experience */}
          <div className="surface rounded-2xl p-3 ring-1 ring-border/60">
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-[hsl(var(--accent))]">
                {typeof experienceYears === "number" ? `${experienceYears}y` : "—"}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Experience</div>
            </div>
          </div>

          {/* Match Score */}
          <div className="surface rounded-2xl p-3 ring-1 ring-border/60">
            <div className="text-center" aria-live="polite">
              <div className="mb-1 text-xl font-bold text-[hsl(var(--info))]">{fmtPct(score)}</div>
              <div className="text-xs font-medium text-muted-foreground">Match Score</div>
            </div>
          </div>

          {/* Test Score — render only after candidate has taken a test */}
          {typeof normalizedTestScore === "number" && Number.isFinite(normalizedTestScore) && (
            <div className="surface rounded-2xl p-3 ring-1 ring-border/60">
              <div className="text-center" aria-live="polite" title="Latest assessment score (MCQ %)">
                <div className="mb-1 text-xl font-bold text-[hsl(var(--success))]">
                  {fmtPct(normalizedTestScore)}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Test Score</div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mb-2 space-y-2">
          <ContactInfo label="Email" icon="ri-mail-line" color="info" value={normalizedEmail} />
          <ContactInfo label="Phone" icon="ri-phone-line" color="success" value={phone} />
          <ContactInfo label="Location" icon="ri-map-pin-line" color="accent" value={location} />
        </div>

        {/* NOTE: As requested, remove Top Skills from the left rail.
                 Skills will be surfaced in the Score & Analysis (Skills Overview) section only. */}
      </div>
    </div>
  );
}

/* =================== Subcomponents =================== */

type Tone = "info" | "success" | "accent";

function ContactInfo({
  label,
  icon,
  color,
  value,
}: {
  label: string;
  icon: string;
  color: Tone;
  value?: string | null;
}) {
  // Map semantic tones to token-powered classes
  const tones: Record<Tone, { box: string; icon: string }> = {
    info: { box: "bg-[hsl(var(--info)/0.12)]", icon: "text-[hsl(var(--info))]" },
    success: { box: "bg-[hsl(var(--success)/0.12)]", icon: "text-[hsl(var(--success))]" },
    accent: { box: "bg-[hsl(var(--accent)/0.12)]", icon: "text-[hsl(var(--accent))]" },
  };

  const t = tones[color];

  return (
    <div className="flex items-center gap-2 rounded-xl surface p-2 ring-1 ring-border/60">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.box}`}>
        <i className={`${icon} ${t.icon} text-sm`} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        {label === "Email" && value ? (
          <a
            href={`mailto:${value}`}
            className="truncate text-xs text-[hsl(var(--primary))] underline"
            title={value}
          >
            {value}
          </a>
        ) : label === "Phone" && value ? (
          <a
            href={`tel:${value}`}
            className="truncate text-xs text-[hsl(var(--primary))] underline"
            title={value}
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-xs text-muted-foreground">{value || "N/A"}</p>
        )}
      </div>
    </div>
  );
}
