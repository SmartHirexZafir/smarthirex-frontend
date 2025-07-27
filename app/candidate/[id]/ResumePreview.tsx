'use client';

import { useState } from 'react';

export default function ResumePreview({ candidate }) {
  const [showFullResume, setShowFullResume] = useState(true);

  if (!candidate || !candidate.resume) return null;

  const { resume } = candidate;

  return (
    <div className="p-4">
      {/* Resume Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Resume Preview</h3>
          {resume.url && (
            <a
              href={resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              <i className="ri-download-line text-sm"></i>
              <span className="text-sm">Download</span>
            </a>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-pdf-line text-red-600 text-lg"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {resume.filename || 'Resume.pdf'}
              </p>
              <p className="text-xs text-gray-600">
                Uploaded via system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Professional Summary</h4>
          <p className="text-gray-700 leading-relaxed bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 text-sm">
            {resume.summary}
          </p>
        </div>
      )}

      {/* Education */}
      {Array.isArray(resume.education) && resume.education.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Education</h4>
          <div className="space-y-2">
            {resume.education.map((edu, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">{edu.degree}</h5>
                    <p className="text-blue-600 font-medium text-sm">{edu.school}</p>
                    <p className="text-xs text-gray-600">Graduated {edu.year}</p>
                  </div>
                  {edu.gpa && (
                    <div className="text-right">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        GPA: {edu.gpa}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {Array.isArray(resume.workHistory) && resume.workHistory.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Work Experience</h4>
          <div className="space-y-3">
            {resume.workHistory.map((work, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 pl-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-r-lg py-2"
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">{work.title}</h5>
                    <p className="text-blue-600 font-medium text-sm">{work.company}</p>
                  </div>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    {work.duration}
                  </span>
                </div>
                <p className="text-gray-700 text-xs">{work.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {Array.isArray(resume.projects) && resume.projects.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Key Projects</h4>
          <div className="space-y-3">
            {resume.projects.map((project, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-3 border border-gray-200/50"
              >
                <h5 className="font-medium text-gray-900 mb-1 text-sm">{project.name}</h5>
                <p className="text-gray-700 text-xs mb-2">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {(project.tech || []).map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-2">Technical Skills</h4>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill, index) => {
              const isMatched = (candidate.matchedSkills || []).includes(skill);
              return (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isMatched
                      ? 'bg-green-100 text-green-800 border border-green-200'
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
  );
}
