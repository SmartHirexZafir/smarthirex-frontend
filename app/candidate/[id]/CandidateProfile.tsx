'use client';

export default function CandidateProfile({ candidate }) {
  if (!candidate) return null;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-green-400/10"></div>

      <div className="relative z-10">
        {/* Profile Header */}
        <div className="text-center mb-4">
          <div className="relative inline-block mb-3">
            <img 
              src={candidate.avatar || '/default-avatar.png'}
              alt={candidate.name || 'Candidate'}
              className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg object-top"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <i className="ri-check-line text-white text-xs"></i>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{candidate.name || 'Unknown'}</h2>
          <p className="text-blue-600 font-medium text-sm mb-1">{candidate.currentRole || 'N/A'}</p>
          <p className="text-gray-600 text-xs">{candidate.company || 'Not specified'}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 mb-1">{candidate.score ?? '—'}%</div>
              <div className="text-xs text-blue-800 font-medium">Match Score</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600 mb-1">{candidate.testScore ?? '—'}%</div>
              <div className="text-xs text-green-800 font-medium">Test Score</div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 p-2 bg-gray-50/80 rounded-lg">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-mail-line text-blue-600 text-sm"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900">Email</p>
              <p className="text-xs text-gray-600 truncate">{candidate.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-gray-50/80 rounded-lg">
            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-phone-line text-green-600 text-sm"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900">Phone</p>
              <p className="text-xs text-gray-600">{candidate.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-gray-50/80 rounded-lg">
            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-map-pin-line text-purple-600 text-sm"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900">Location</p>
              <p className="text-xs text-gray-600">{candidate.location || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Skills Preview */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Skills</h3>
          <div className="flex flex-wrap gap-1">
            {(candidate.skills || []).map((skill, index) => {
              const isMatched = (candidate.matchedSkills || []).includes(skill);
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
      </div>
    </div>
  );
}
