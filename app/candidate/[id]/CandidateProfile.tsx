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

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-green-400/10"></div>

      <div className="relative z-10">
        {/* Profile Header */}
        <div className="text-center mb-4">
          <div className="relative inline-block mb-3">
            <img 
              src={avatar || '/default-avatar.png'}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg object-top"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <i className="ri-check-line text-white text-xs"></i>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
          <p className="text-blue-600 font-medium text-sm mb-1">{currentRole}</p>
          <p className="text-gray-600 text-xs">{company}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 mb-1">
                {score !== undefined ? `${score}%` : '—'}
              </div>
              <div className="text-xs text-blue-800 font-medium">Match Score</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600 mb-1">
                {testScore !== undefined ? `${testScore}%` : '—'}
              </div>
              <div className="text-xs text-green-800 font-medium">Test Score</div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <ContactInfo label="Email" icon="ri-mail-line" color="blue" value={email} />
          <ContactInfo label="Phone" icon="ri-phone-line" color="green" value={phone} />
          <ContactInfo label="Location" icon="ri-map-pin-line" color="purple" value={location} />
        </div>

        {/* Skills Preview */}
        {skills.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Skills</h3>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill, index) => {
                const isMatched = matchedSkills.includes(skill);
                return (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isMatched
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {skill}
                    {isMatched && <i className="ri-check-line ml-1"></i>}
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
  color: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50/80 rounded-lg">
      <div className={`w-6 h-6 bg-${color}-100 rounded-lg flex items-center justify-center`}>
        <i className={`${icon} text-${color}-600 text-sm`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-600 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
