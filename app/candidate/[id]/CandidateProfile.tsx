'use client';

type Candidate = {
  name?: string;
  avatar?: string;
  currentRole?: string;
  company?: string;
  score?: number;
  testScore?: number;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  matchedSkills?: string[];
};

export default function CandidateProfile({ candidate }: { candidate: Candidate }) {
  if (!candidate) return null;

  const {
    name = 'Unnamed Candidate',
    avatar,
    currentRole = 'N/A',
    company = 'Not specified',
    score,
    testScore,
    email,
    phone,
    location = 'N/A',
    skills = [],
    matchedSkills = []
  } = candidate;

  const fmtPct = (v?: number) =>
    typeof v === 'number' && isFinite(v) ? `${Math.round(v)}%` : '—';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-4 shadow-xl backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-green-400/10" />

      <div className="relative z-10">
        {/* Profile Header */}
        <div className="mb-4 text-center">
          <div className="relative mb-3 inline-block">
            {/* simple img to avoid Next/Image config needs */}
            <img
              src={avatar && avatar.trim() ? avatar : '/default-avatar.png'}
              alt={name}
              className="h-20 w-20 rounded-full border-3 border-white object-cover object-top shadow-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-500">
              <i className="ri-check-line text-xs text-white" aria-hidden />
            </div>
          </div>
          <h2 className="mb-1 text-xl font-bold text-gray-900">{name}</h2>
          <p className="mb-1 text-sm font-medium text-blue-600">{currentRole}</p>
          <p className="text-xs text-gray-600">{company}</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3">
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-blue-600">{fmtPct(score)}</div>
              <div className="text-xs font-medium text-blue-800">Match Score</div>
            </div>
          </div>

          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
            <div className="text-center">
              <div className="mb-1 text-xl font-bold text-green-600">{fmtPct(testScore)}</div>
              <div className="text-xs font-medium text-green-800">Test Score</div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-4 space-y-2">
          <ContactInfo label="Email" icon="ri-mail-line" color="blue" value={email} />
          <ContactInfo label="Phone" icon="ri-phone-line" color="green" value={phone} />
          <ContactInfo label="Location" icon="ri-map-pin-line" color="purple" value={location} />
        </div>

        {/* Skills Preview */}
        {skills.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Top Skills</h3>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill, index) => {
                const isMatched = matchedSkills.includes(skill);
                return (
                  <span
                    key={`${skill}-${index}`}
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${
                      isMatched
                        ? 'border-blue-200 bg-blue-100 text-blue-800'
                        : 'border-gray-200 bg-gray-100 text-gray-600'
                    }`}
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

function ContactInfo({
  label,
  icon,
  color,
  value
}: {
  label: string;
  icon: string;
  color: 'blue' | 'green' | 'purple';
  value?: string | null;
}) {
  // Tailwind-safe class mapping (no dynamic template strings)
  const colorClasses: Record<typeof color, { box: string; icon: string }> = {
    blue:   { box: 'bg-blue-100',   icon: 'text-blue-600' },
    green:  { box: 'bg-green-100',  icon: 'text-green-600' },
    purple: { box: 'bg-purple-100', icon: 'text-purple-600' },
  };

  const c = colorClasses[color];

  return (
    <div className="flex items-center space-x-2 rounded-lg bg-gray-50/80 p-2">
      <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${c.box}`}>
        <i className={`${icon} ${c.icon} text-sm`} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="truncate text-xs text-gray-600">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
