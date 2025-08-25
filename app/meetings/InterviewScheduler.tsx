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
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      role: 'Frontend Developer',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-001&orientation=squarish',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      role: 'Backend Developer',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-002&orientation=squarish',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      role: 'Full Stack Developer',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-003&orientation=squarish',
    },
  ];

  const timeSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
  ];

  const handleSchedule = () => {
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setShowConfirmation(true);
    }, 2000);
  };

  const selectedCandidateData = candidates.find((c) => c.id === selectedCandidate);

  if (showConfirmation) {
    return (
      <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-100">
            <i className="ri-check-line text-3xl text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Interview Scheduled Successfully!</h2>
          <p className="text-muted-foreground mb-6">All participants have been notified</p>

          <div className="rounded-xl p-6 border border-border mb-6 bg-gradient-to-r from-muted to-muted/60">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 bg-primary">
                  <i className="ri-video-line text-primary-foreground" />
                </div>
                <p className="text-sm font-medium">Google Meet invite generated</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 bg-blue-600">
                  <i className="ri-mail-line text-white" />
                </div>
                <p className="text-sm font-medium">Email sent to candidate</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 bg-violet-600">
                  <i className="ri-dashboard-line text-white" />
                </div>
                <p className="text-sm font-medium">Dashboard updated</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-6 bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCandidateData?.avatar}
                  alt={selectedCandidateData?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="font-medium">{selectedCandidateData?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate} at {selectedTime}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-video-line" />
                <span>Join Meeting</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowConfirmation(false)}
              type="button"
              className="px-6 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Schedule Another
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
      <div className="flex items-center mb-6">
        <i className="ri-calendar-event-line text-2xl text-foreground/80 mr-3" />
        <h2 className="text-xl font-bold">Schedule Interview</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Candidate Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                  {candidate.name} — {candidate.role}
                </option>
              ))}
            </select>
          </div>

          {selectedCandidateData && (
            <div className="p-4 rounded-xl border border-border bg-muted/50">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCandidateData.avatar}
                  alt={selectedCandidateData.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{selectedCandidateData.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCandidateData.email}</p>
                  <p className="text-sm">{selectedCandidateData.role}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Interview Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Time Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((time) => {
                const isActive = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    type="button"
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-foreground hover:bg-muted/70 border border-border'
                    }`}
                    aria-pressed={isActive}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Interview Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific topics or requirements for the interview..."
              className="w-full p-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Schedule Button */}
      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-muted-foreground">
              Auto-schedule next round if passed
            </span>
          </label>
        </div>

        <button
          onClick={handleSchedule}
          disabled={!selectedCandidate || !selectedDate || !selectedTime || isScheduling}
          type="button"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-busy={isScheduling}
        >
          {isScheduling ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/70 border-t-transparent rounded-full animate-spin" />
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <i className="ri-video-line" />
              <span>Schedule via Google Meet</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
