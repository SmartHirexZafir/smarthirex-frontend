'use client';

import { useState } from 'react';
import Link from 'next/link';
import TestAssignment from './TestAssignment';
import InterviewScheduler from './InterviewScheduler';
import StatusDashboard from './StatusDashboard';

type HubTab = 'tests' | 'schedule' | 'dashboard';

export default function MeetingsHub() {
  const [activeTab, setActiveTab] = useState<HubTab>('tests');

  return (
    <div className="min-h-screen bg-background page-aurora">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-lg border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                className="p-2 rounded-lg transition-colors text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Go back"
              >
                <i className="ri-arrow-left-line text-xl" />
              </Link>

              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <i className="ri-calendar-event-line mr-3 text-foreground/80" />
                  Interviews &amp; Tests Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage interviews, tests, and candidate assessments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground">
                <i className="ri-calendar-check-line mr-2" />
                5 Scheduled Today
              </div>
              <div className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-foreground border border-border">
                <i className="ri-test-tube-line mr-2" />
                12 Tests Pending
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border p-4 md:p-6 mb-6">
          <div className="flex gap-1 bg-muted p-1 rounded-lg border border-border">
            {([
              { id: 'tests', label: 'Assign Tests', icon: 'ri-test-tube-line' },
              { id: 'schedule', label: 'Schedule Interviews', icon: 'ri-calendar-event-line' },
              { id: 'dashboard', label: 'Status Dashboard', icon: 'ri-dashboard-line' },
            ] as Array<{ id: HubTab; label: string; icon: string }>).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`flex-1 flex items-center justify-center px-4 md:px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? 'bg-background text-primary shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                  aria-pressed={isActive}
                >
                  <i className={`${tab.icon} mr-2`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'tests' && <TestAssignment />}
          {activeTab === 'schedule' && <InterviewScheduler />}
          {activeTab === 'dashboard' && <StatusDashboard />}
        </div>
      </div>
    </div>
  );
}
