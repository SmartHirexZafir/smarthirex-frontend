'use client';

import { useState } from 'react';

export default function TestAssignment() {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [testType, setTestType] = useState('smart');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const candidates = [
    { id: '1', name: 'Sarah Johnson', skills: ['React', 'JavaScript', 'TypeScript'], experience: '4 years', avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-test-001&orientation=squarish' },
    { id: '2', name: 'Michael Chen', skills: ['Python', 'Django', 'AWS'], experience: '3 years', avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-test-002&orientation=squarish' },
    { id: '3', name: 'Emily Rodriguez', skills: ['Node.js', 'Express', 'MongoDB'], experience: '5 years', avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-test-003&orientation=squarish' }
  ];

  const handleGenerateTest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);

  return (
    <div className="space-y-6">
      {/* Candidate Selection */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
        <div className="flex items-center mb-4">
          <i className="ri-test-tube-line text-2xl text-blue-600 mr-3"></i>
          <h2 className="text-xl font-bold text-gray-900">Assign AI Test to Candidate</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Candidate</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a candidate...</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} - {candidate.experience} experience
                </option>
              ))}
            </select>
            
            {selectedCandidateData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src={selectedCandidateData.avatar} 
                    alt={selectedCandidateData.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedCandidateData.name}</h3>
                    <p className="text-sm text-gray-600">{selectedCandidateData.experience} experience</p>
                  </div>
                </div>
                
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center">
                    <i className="ri-lightbulb-line text-yellow-600 mr-2"></i>
                    <span className="text-sm font-medium text-yellow-800">Smart Suggestion:</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Candidate claims {selectedCandidateData.skills.join(', ')}, suggest {selectedCandidateData.skills[0]} MCQ + 1 code test
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedCandidateData.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedCandidateData.experience}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Test Type</label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="testType"
                  value="smart"
                  checked={testType === 'smart'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">Smart AI Test</p>
                  <p className="text-sm text-gray-600">Auto-generated based on candidate skills</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="testType"
                  value="custom"
                  checked={testType === 'custom'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">Custom Test</p>
                  <p className="text-sm text-gray-600">Choose questions manually</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <i className="ri-eye-line"></i>
            <span>Preview Test</span>
          </button>
          
          <button
            onClick={handleGenerateTest}
            disabled={!selectedCandidate || isGenerating}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <i className="ri-send-plane-line"></i>
                <span>Generate & Send Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Preview */}
      {showPreview && selectedCandidateData && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Test Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-close-line text-gray-500"></i>
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <i className="ri-check-line text-white"></i>
                </div>
                <div>
                  <p className="font-medium text-blue-900">2 MCQs</p>
                  <p className="text-sm text-blue-600">Multiple Choice</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <i className="ri-code-line text-white"></i>
                </div>
                <div>
                  <p className="font-medium text-green-900">1 Code Test</p>
                  <p className="text-sm text-green-600">Programming</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <i className="ri-question-line text-white"></i>
                </div>
                <div>
                  <p className="font-medium text-purple-900">1 Scenario</p>
                  <p className="text-sm text-purple-600">Problem Solving</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">MCQ 1</span>
                <span className="text-sm text-gray-600">React Fundamentals</span>
              </div>
              <p className="font-medium text-gray-900 mb-2">What is the primary purpose of React hooks?</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>A) To manage component lifecycle</p>
                <p>B) To handle state in functional components</p>
                <p>C) To optimize performance</p>
                <p>D) To create reusable components</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Code</span>
                <span className="text-sm text-gray-600">JavaScript Implementation</span>
              </div>
              <p className="font-medium text-gray-900 mb-2">Implement a function that debounces API calls:</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <code className="text-sm text-gray-700">
                  function debounce(func, delay) {"{"}
                  <br />
                  &nbsp;&nbsp;// Your implementation here
                  <br />
                  {"}"}
                </code>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Test Settings</p>
                <p className="text-sm text-gray-600">Time limit: 45 minutes • Auto-submit enabled</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Edit Test
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
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