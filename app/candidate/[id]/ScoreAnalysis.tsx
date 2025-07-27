'use client';

export default function ScoreAnalysis({ candidate, detailed = false }) {
  if (!candidate) return null;

  const {
    score = 0,
    testScore = 0,
    strengths = [],
    redFlags = [],
    matchedSkills = [],
    missingSkills = [],
    selectionReason = '',
    experience = 0,
  } = candidate;

  const experienceMatch = experience ? Math.min((Number(experience) / 10) * 100, 100) : 0;

  if (!detailed) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Analysis</h3>

        <div className="space-y-3">
          {/* Match Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Match Score</span>
              <span className="text-sm font-bold text-blue-600">{score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              ></div>
            </div>
          </div>

          {/* Test Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Test Score</span>
              <span className="text-sm font-bold text-green-600">{testScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${testScore}%` }}
              ></div>
            </div>
          </div>

          {/* Experience Match */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Experience</span>
              <span className="text-sm font-bold text-purple-600">{Math.round(experienceMatch)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${experienceMatch}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Insights</h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li className="flex items-center">
              <i className="ri-check-line text-green-600 mr-1"></i>
              Strong technical skills match
            </li>
            <li className="flex items-center">
              <i className="ri-check-line text-green-600 mr-1"></i>
              Relevant experience level
            </li>
            <li className="flex items-center">
              <i className="ri-information-line text-blue-600 mr-1"></i>
              Good cultural fit potential
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
            <i className="ri-star-line text-green-600 mr-2"></i>
            Strengths
          </h4>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg border border-green-200/50"
              >
                <i className="ri-check-line text-green-600 mt-0.5"></i>
                <span className="text-sm text-gray-700">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
            <i className="ri-flag-line text-red-600 mr-2"></i>
            Areas of Concern
          </h4>
          <div className="space-y-2">
            {redFlags.map((flag, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg border border-red-200/50"
              >
                <i className="ri-alert-line text-red-600 mt-0.5"></i>
                <span className="text-sm text-gray-700">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Match */}
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-900 mb-2">Skills Analysis</h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200/50">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Matched Skills</h5>
            <div className="flex flex-wrap gap-1">
              {matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200/50">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Missing Skills</h5>
            <div className="flex flex-wrap gap-1">
              {missingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Recommendation */}
      {selectionReason && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200/50">
          <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
            <i className="ri-lightbulb-line text-blue-600 mr-2"></i>
            Selection Recommendation
          </h4>
          <p className="text-sm text-gray-700">{selectionReason}</p>
        </div>
      )}
    </div>
  );
}
