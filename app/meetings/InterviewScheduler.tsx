'use client';

import { useState } from 'react';

export default function InterviewScheduler() {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const candidates = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', role: 'Frontend Developer', avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-001&orientation=squarish' },
    { id: '2', name: 'Michael Chen', email: 'michael.chen@email.com', role: 'Backend Developer', avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-002&orientation=squarish' },
    { id: '3', name: 'Emily Rodriguez', email: 'emily.rodriguez@email.com', role: 'Full Stack Developer', avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-003&orientation=squarish' }
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const handleSchedule = () => {
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setShowConfirmation(true);
    }, 2000);
  };

  const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);

  if (showConfirmation) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-line text-3xl text-green-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Scheduled Successfully!</h2>
          <p className="text-gray-600 mb-6">All participants have been notified</p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200/50 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="ri-video-line text-white"></i>
                </div>
                <p className="text-sm font-medium text-gray-900">Google Meet invite generated</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="ri-mail-line text-white"></i>
                </div>
                <p className="text-sm font-medium text-gray-900">Email sent to candidate</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="ri-dashboard-line text-white"></i>
                </div>
                <p className="text-sm font-medium text-gray-900">Dashboard updated</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedCandidateData?.avatar} 
                  alt={selectedCandidateData?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedCandidateData?.name}</p>
                  <p className="text-sm text-gray-600">{selectedDate} at {selectedTime}</p>
                </div>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <i className="ri-video-line"></i>
                <span>Join Meeting</span>
              </button>
            </div>
          </div>
          
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => setShowConfirmation(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Schedule Another
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200">
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
      <div className="flex items-center mb-6">
        <i className="ri-calendar-event-line text-2xl text-blue-600 mr-3"></i>
        <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Candidate Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Candidate</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a candidate...</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} - {candidate.role}
                </option>
              ))}
            </select>
          </div>
          
          {selectedCandidateData && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedCandidateData.avatar} 
                  alt={selectedCandidateData.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCandidateData.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCandidateData.email}</p>
                  <p className="text-sm text-blue-600">{selectedCandidateData.role}</p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interview Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        
        {/* Time Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTime === time
                      ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interview Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific topics or requirements for the interview..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
        </div>
      </div>
      
      {/* Schedule Button */}
      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-600">Auto-schedule next round if passed</span>
          </label>
        </div>
        
        <button
          onClick={handleSchedule}
          disabled={!selectedCandidate || !selectedDate || !selectedTime || isScheduling}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScheduling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <i className="ri-video-line"></i>
              <span>Schedule via Google Meet</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}