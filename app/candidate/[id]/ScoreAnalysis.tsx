'use client';

type ScoreAnalysisProps = {
  candidate: any;
  detailed?: boolean;
};

export default function ScoreAnalysis({ candidate, detailed = false }: ScoreAnalysisProps) {
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

  const experienceYears = typeof experience === 'string' ? parseFloat(experience) : Number(experience);
  const experienceMatch = experienceYears ? Math.min((experienceYears / 10) * 100, 100) : 0;

  if (!detailed) {
    const hasInsights = strengths.length > 0 || redFlags.length > 0;

    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Analysis</h3>

        <div className="space-y-3">
          <ProgressBar label="Match Score" value={score} color="blue" />
          <ProgressBar label="Test Score" value={testScore} color="green" />
          <ProgressBar label="Experience" value={Math.round(experienceMatch)} color="purple" />
        </div>

        {/* Only show quick insights if strengths exist */}
        {hasInsights && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Insights</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-1"></i> {s}
                </li>
              ))}
              {redFlags.map((r, i) => (
                <li key={`r-${i}`} className="flex items-center">
                  <i className="ri-alert-line text-red-600 mr-1"></i> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>

      {/* Strengths */}
      {strengths.length > 0 && (
        <AnalysisBlock icon="ri-star-line" title="Strengths" color="green">
          {strengths}
        </AnalysisBlock>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <AnalysisBlock icon="ri-flag-line" title="Areas of Concern" color="red">
          {redFlags}
        </AnalysisBlock>
      )}

      {/* Skills Match */}
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-900 mb-2">Skills Analysis</h4>
        <div className="grid grid-cols-1 gap-3">
          <SkillBlock title="Matched Skills" skills={matchedSkills} bg="from-green-50 to-blue-50" text="green" />
          <SkillBlock title="Missing Skills" skills={missingSkills} bg="from-yellow-50 to-orange-50" text="yellow" />
        </div>
      </div>

      {/* Recommendation */}
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

// Subcomponents

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap = {
    blue: 'from-blue-500 to-purple-500 text-blue-600',
    green: 'from-green-500 to-blue-500 text-green-600',
    purple: 'from-purple-500 to-pink-500 text-purple-600',
  };

  const bg = colorMap[color as keyof typeof colorMap] || 'from-gray-400 to-gray-600 text-gray-600';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${bg.split(' ')[2]}`}>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-gradient-to-r ${bg.split(' ').slice(0, 2).join(' ')} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function AnalysisBlock({ icon, title, color, children }: { icon: string; title: string; color: string; children: string[] }) {
  const bg = color === 'green' ? 'bg-green-50' : 'bg-red-50';
  const border = color === 'green' ? 'border-green-200/50' : 'border-red-200/50';
  const iconColor = color === 'green' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="mb-4">
      <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
        <i className={`${icon} ${iconColor} mr-2`}></i>
        {title}
      </h4>
      <div className="space-y-2">
        {children.map((text, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 p-2 ${bg} rounded-lg border ${border}`}
          >
            <i className={`ri-check-line ${iconColor} mt-0.5`}></i>
            <span className="text-sm text-gray-700">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillBlock({
  title,
  skills,
  bg,
  text,
}: {
  title: string;
  skills: string[];
  bg: string;
  text: string;
}) {
  return (
    <div className={`bg-gradient-to-r ${bg} rounded-lg p-3 border border-${text}-200/50`}>
      <h5 className="text-sm font-medium text-gray-900 mb-2">{title}</h5>
      <div className="flex flex-wrap gap-1">
        {skills.map((skill, index) => (
          <span
            key={index}
            className={`bg-${text}-100 text-${text}-800 px-2 py-1 rounded-full text-xs font-medium`}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
