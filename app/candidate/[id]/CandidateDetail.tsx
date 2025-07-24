
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CandidateProfile from './CandidateProfile';
import ResumePreview from './ResumePreview';
import ActionButtons from './ActionButtons';
import ScoreAnalysis from './ScoreAnalysis';

export default function CandidateDetail({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Mock candidate data - in real app, fetch from API
    const mockCandidate = {
      id: candidateId,
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      email: 'sarah.johnson@email.com',
      score: 92,
      rank: 1,
      testScore: 85,
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'AWS', 'GraphQL'],
      experience: '4 years',
      matchedSkills: ['React', 'JavaScript', 'TypeScript'],
      missingSkills: ['Docker', 'Kubernetes'],
      location: 'San Francisco, CA',
      currentRole: 'Senior Frontend Developer',
      company: 'Tech Solutions Inc.',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=candidate-profile-001&orientation=squarish',
      resume: {
        url: '#',
        summary: 'Experienced frontend developer with 4+ years of experience building scalable web applications using React and modern JavaScript frameworks. Proven track record of delivering high-quality user interfaces and collaborating with cross-functional teams.',
        education: [
          {
            degree: 'Bachelor of Science in Computer Science',
            school: 'Stanford University',
            year: '2020',
            gpa: '3.8/4.0'
          }
        ],
        workHistory: [
          {
            title: 'Senior Frontend Developer',
            company: 'Tech Solutions Inc.',
            duration: '2022 - Present',
            description: 'Led frontend development for 3 major projects, improved performance by 40%'
          },
          {
            title: 'Frontend Developer',
            company: 'StartupXYZ',
            duration: '2020 - 2022',
            description: 'Developed responsive web applications using React and Redux'
          }
        ],
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Built a full-stack e-commerce solution using React, Node.js, and MongoDB',
            tech: ['React', 'Node.js', 'MongoDB', 'Stripe API']
          },
          {
            name: 'Task Management App',
            description: 'Created a collaborative task management application with real-time updates',
            tech: ['React', 'Socket.io', 'Express', 'PostgreSQL']
          }
        ]
      },
      selectionReason: 'Strong technical skills in React and JavaScript with proven experience in frontend development. Excellent problem-solving abilities and team collaboration skills.',
      redFlags: ['Gap in employment history (3 months)', 'No backend experience mentioned'],
      strengths: ['Excellent React skills', 'Strong educational background', 'Leadership experience', 'Modern tech stack knowledge'],
      status: 'new' // new, shortlisted, rejected, interviewed
    };

    // Simulate API call
    setTimeout(() => {
      setCandidate(mockCandidate);
      setLoading(false);
    }, 1000);
  }, [candidateId]);

  const handleStatusChange = (newStatus: string) => {
    setCandidate(prev => ({ ...prev, status: newStatus }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-user-line text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 text-lg">Candidate not found</p>
          <Link href="/upload" className="text-blue-600 hover:text-blue-800 mt-2 inline-block cursor-pointer">
            Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/upload" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
                <p className="text-gray-600">Detailed view and assessment</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-medal-line mr-2"></i>
                Rank #{candidate.rank}
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-star-line mr-2"></i>
                {candidate.score}% Match
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column - Profile & Actions */}
          <div className="lg:col-span-1 space-y-4">
            <CandidateProfile candidate={candidate} />
            <ActionButtons candidate={candidate} onStatusChange={handleStatusChange} />
            <ScoreAnalysis candidate={candidate} />
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-md rounded-t-2xl border border-gray-200/50 p-4">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'profile', label: 'Resume', icon: 'ri-file-text-line' },
                  { id: 'analysis', label: 'Analysis', icon: 'ri-bar-chart-line' },
                  { id: 'history', label: 'History', icon: 'ri-history-line' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white/80 backdrop-blur-md rounded-b-2xl border-x border-b border-gray-200/50">
              {activeTab === 'profile' && <ResumePreview candidate={candidate} />}
              {activeTab === 'analysis' && <ScoreAnalysis candidate={candidate} detailed={true} />}
              {activeTab === 'history' && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction History</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <i className="ri-eye-line text-blue-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Profile viewed</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <i className="ri-upload-line text-green-600"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Resume uploaded</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
