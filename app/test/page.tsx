'use client';

import { useState } from 'react';

export default function TestAssignment() {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [testType, setTestType] = useState<'smart' | 'custom'>('smart');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const candidates = [
    {
      id: '1',
      name: 'Sarah Johnson',
      skills: ['React', 'JavaScript', 'TypeScript'],
      experience: '4 years',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-test-001&orientation=squarish',
    },
    {
      id: '2',
      name: 'Michael Chen',
      skills: ['Python', 'Django', 'AWS'],
      experience: '3 years',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-test-002&orientation=squarish',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      skills: ['Node.js', 'Express', 'MongoDB'],
      experience: '5 years',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-test-003&orientation=squarish',
    },
  ];

  const handleGenerateTest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  const selectedCandidateData = candidates.find((c) => c.id === selectedCandidate);

  return (
    <div className="space-y-6">
      {/* Candidate Selection */}
      <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center mb-4">
          <i className="ri-test-tube-line text-2xl text-foreground/80 mr-3" />
          <h2 className="text-xl font-bold">Assign AI Test to Candidate</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Select Candidate
            </label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-input text-foreground pr-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Select candidate"
            >
              <option value="">Choose a candidate...</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} — {candidate.experience} experience
                </option>
              ))}
            </select>

            {selectedCandidateData && (
              <div className="mt-4 p-4 rounded-xl border border-border/60 bg-gradient-to-r from-muted to-muted/60">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={selectedCandidateData.avatar}
                    alt={selectedCandidateData.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{selectedCandidateData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidateData.experience} experience
                    </p>
                  </div>
                </div>

                <div className="bg-muted border border-border rounded-lg p-3 mb-3">
                  <div className="flex items-center">
                    <i className="ri-lightbulb-line mr-2" />
                    <span className="text-sm font-medium">Smart Suggestion:</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Candidate claims {selectedCandidateData.skills.join(', ')}, suggest{' '}
                    {selectedCandidateData.skills[0]} MCQ + 1 code test
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCandidateData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-muted text-foreground/80 px-3 py-1 rounded-full text-sm font-medium border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                  <span className="bg-muted text-foreground/80 px-3 py-1 rounded-full text-sm font-medium border border-border">
                    {selectedCandidateData.experience}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Test Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-input rounded-xl cursor-pointer hover:bg-muted/40">
                <input
                  type="radio"
                  name="testType"
                  value="smart"
                  checked={testType === 'smart'}
                  onChange={(e) => setTestType(e.target.value as 'smart')}
                  className="mr-3"
                  aria-label="Smart AI Test"
                />
                <div>
                  <p className="font-medium">Smart AI Test</p>
                  <p className="text-sm text-muted-foreground">
                    Auto-generated based on candidate skills
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-input rounded-xl cursor-pointer hover:bg-muted/40">
                <input
                  type="radio"
                  name="testType"
                  value="custom"
                  checked={testType === 'custom'}
                  onChange={(e) => setTestType(e.target.value as 'custom')}
                  className="mr-3"
                  aria-label="Custom Test"
                />
                <div>
                  <p className="font-medium">Custom Test</p>
                  <p className="text-sm text-muted-foreground">Choose questions manually</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setShowPreview(!showPreview)}
            type="button"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="ri-eye-line" />
            <span>Preview Test</span>
          </button>

          <button
            onClick={handleGenerateTest}
            type="button"
            disabled={!selectedCandidate || isGenerating}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/70 border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <i className="ri-send-plane-line" />
                <span>Generate &amp; Send Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Preview */}
      {showPreview && selectedCandidateData && (
        <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Test Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              type="button"
              className="p-2 hover:bg-muted/60 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close preview"
            >
              <i className="ri-close-line text-muted-foreground" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-border bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/90">
                  <i className="ri-check-line text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">2 MCQs</p>
                  <p className="text-sm text-muted-foreground">Multiple Choice</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-600">
                  <i className="ri-code-line text-white" />
                </div>
                <div>
                  <p className="font-medium">1 Code Test</p>
                  <p className="text-sm text-muted-foreground">Programming</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-600">
                  <i className="ri-question-line text-white" />
                </div>
                <div>
                  <p className="font-medium">1 Scenario</p>
                  <p className="text-sm text-muted-foreground">Problem Solving</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground/80 border border-border">
                  MCQ 1
                </span>
                <span className="text-sm text-muted-foreground">React Fundamentals</span>
              </div>
              <p className="font-medium mb-2">What is the primary purpose of React hooks?</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>A) To manage component lifecycle</p>
                <p>B) To handle state in functional components</p>
                <p>C) To optimize performance</p>
                <p>D) To create reusable components</p>
              </div>
            </div>

            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground/80 border border-border">
                  Code
                </span>
                <span className="text-sm text-muted-foreground">JavaScript Implementation</span>
              </div>
              <p className="font-medium mb-2">Implement a function that debounces API calls:</p>
              <div className="bg-muted/60 p-3 rounded-lg overflow-x-auto">
                <code className="text-sm text-foreground">
                  {`function debounce(func, delay) {\n  // Your implementation here\n}`}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Test Settings</p>
                <p className="text-sm text-muted-foreground">
                  Time limit: 45 minutes • Auto-submit enabled
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Edit Test
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Send to Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
