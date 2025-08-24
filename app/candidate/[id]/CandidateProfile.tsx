// app/candidate/[id]/CandidateProfile.tsx
"use client";

type Candidate = {
  name?: string;
  avatar?: string;
  currentRole?: string;
  company?: string;
  score?: number;
  testScore?: number;           // frontend camelCase
  test_score?: number;          // backend snake_case
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  matchedSkills?: string[];
  resume?: { email?: string };  // optional nested email
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

export default function CandidateProfile({ candidate }: { candidate: Candidate }) {
  if (!candidate) return null;

  const {
    name = "Unnamed Candidate",
    avatar,
    currentRole = "N/A",
    company = "Not specified",
    score,
    test_score,
    testScore: testScoreCamel,
    email,
    phone,
    location = "N/A",
    skills = [],
    matchedSkills = [],
    resume,
  } = candidate;

  // Prefer backend value; fall back to camelCase
  const normalizedTestScore =
    typeof test_score === "number" && Number.isFinite(test_score)
      ? test_score
      : typeof testScoreCamel === "number" && Number.isFinite(testScoreCamel)
      ? testScoreCamel
      : undefined;

  const normalizedEmail = email || resume?.email || undefined;

  const fmtPct = (v?: number) =>
    typeof v === "number" && Number.isFinite(v) ? `${Math.round(v)}%` : "—";

  return (
    <div className="panel glass gradient-border relative overflow-hidden">
      {/* header */}
      <div className="relative z-10">
        {/* Profile Header */}
        <div className="mb-4 text-center">
          <div className="relative mb-3 inline-block">
            {/* plain <img> to avoid Next/Image config; safe error fallback */}
            <img
              src={avatar && avatar.trim() ? avatar : "/default-avatar.png"}
              alt={name}
              className="h-20 w-20 rounded-full ring-2 ring-background object-cover object-top shadow-lux"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                // Swap to inline SVG ONCE to stop 404 retry loop
                if (img.src !== FALLBACK_SVG) {
                  img.src = FALLBACK_SVG;
                  img.onerror = null;
                }
              }}
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-success shadow-glow">
              <i className="ri-check-line text-xs text-[hsl(var(--success-foreground))]" aria-hidden />
            </div>
          </div>
          <h2 className="mb-1 text-xl font-bold">{name}</h2>
          <p className="mb-1 text-sm font-medium text-[hsl(var(--info))]">{currentRole}</p>
          <p className="text-xs text-muted-foreground">{company}</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="surface rounded-2xl p-3 ring-1 ring-border/60">
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-[hsl(var(--info))]">{fmtPct(score)}</div>
              <div className="text-xs font-medium text-muted-foreground">Match Score</div>
            </div>
          </div>

          <div className="surface rounded-2xl p-3 ring-1 ring-border/60">
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-[hsl(var(--success))]">
                {fmtPct(normalizedTestScore)}
              </div>
              <div
                className="text-xs font-medium text-muted-foreground"
                title="Latest assessment score (MCQ %)"
              >
                Test Score
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-4 space-y-2">
          <ContactInfo label="Email" icon="ri-mail-line" color="info" value={normalizedEmail} />
          <ContactInfo label="Phone" icon="ri-phone-line" color="success" value={phone} />
          <ContactInfo label="Location" icon="ri-map-pin-line" color="accent" value={location} />
        </div>

        {/* Skills Preview */}
        {skills.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Top Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, index) => {
                const isMatched = matchedSkills.includes(skill);
                return (
                  <span
                    key={`${skill}-${index}`}
                    className={[
                      "badge",
                      isMatched
                        ? "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))] ring-1 ring-[hsl(var(--info)/0.35)]"
                        : "bg-muted/60 text-muted-foreground ring-1 ring-border/60",
                    ].join(" ")}
                  >
                    {skill}
                    {isMatched && <i className="ri-check-line ml-1" aria-hidden />}
                  </span>
                );
              })}
            </div>
          </div>
        )}
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
        <p className="truncate text-xs text-muted-foreground">{value || "N/A"}</p>
      </div>
    </div>
  );
}
