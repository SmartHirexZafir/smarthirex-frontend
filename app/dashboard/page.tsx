'use client';

import { useState } from 'react';

type TabId = 'pending' | 'completed' | 'noshow';

type ItemStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'No Show';
type ItemType = 'Interview' | 'Test';

interface Item {
  id: string;
  candidate: string;
  type: ItemType;
  date: string;
  time: string;
  status: ItemStatus;
  testScore: number | null;
  meetUrl: string | null;
  avatar: string;
}

const mockData: Record<TabId, Item[]> = {
  pending: [
    {
      id: '1',
      candidate: 'Sarah Johnson',
      type: 'Interview',
      date: '2024-01-20',
      time: '10:00 AM',
      status: 'Scheduled',
      testScore: null,
      meetUrl: 'https://meet.google.com/abc-def-ghi',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-001&orientation=squarish',
    },
    {
      id: '2',
      candidate: 'Michael Chen',
      type: 'Test',
      date: '2024-01-19',
      time: '2:00 PM',
      status: 'In Progress',
      testScore: null,
      meetUrl: null,
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-002&orientation=squarish',
    },
  ],
  completed: [
    {
      id: '3',
      candidate: 'Emily Rodriguez',
      type: 'Test',
      date: '2024-01-18',
      time: '11:00 AM',
      status: 'Completed',
      testScore: 85,
      meetUrl: null,
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-003&orientation=squarish',
    },
    {
      id: '4',
      candidate: 'David Kim',
      type: 'Interview',
      date: '2024-01-17',
      time: '3:30 PM',
      status: 'Completed',
      testScore: 92,
      meetUrl: 'https://meet.google.com/xyz-abc-def',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-004&orientation=squarish',
    },
  ],
  noshow: [
    {
      id: '5',
      candidate: 'Jessica Brown',
      type: 'Interview',
      date: '2024-01-16',
      time: '9:00 AM',
      status: 'No Show',
      testScore: null,
      meetUrl: 'https://meet.google.com/no-show-123',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-005&orientation=squarish',
    },
  ],
};

function getStatusColor(status: ItemStatus): string {
  // Keeping semantic colors for statuses; neutrals elsewhere use theme tokens.
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'No Show':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-muted text-foreground';
  }
}

function getTypeIcon(type: ItemType): string {
  return type === 'Interview' ? 'ri-video-line' : 'ri-test-tube-line';
}

export default function StatusDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const currentData = mockData[activeTab] ?? [];

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(currentData.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  return (
    <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <i className="ri-dashboard-line text-2xl text-foreground/80 mr-3" />
          <h2 className="text-xl font-bold">Meeting &amp; Test Status Dashboard</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="ri-download-line" />
            <span>Export Report</span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="ri-mail-line" />
            <span>Bulk Email</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 border border-border">
        {([
          { id: 'pending', label: 'Pending', icon: 'ri-time-line', count: mockData.pending.length },
          {
            id: 'completed',
            label: 'Completed',
            icon: 'ri-check-line',
            count: mockData.completed.length,
          },
          {
            id: 'noshow',
            label: 'No-Show / Rejected',
            icon: 'ri-close-line',
            count: mockData.noshow.length,
          },
        ] as Array<{ id: TabId; label: string; icon: string; count: number }>).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedItems([]);
            }}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.id
                ? 'bg-background text-primary shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <i className={`${tab.icon} mr-2`} />
            {tab.label}
            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-muted text-foreground/80 border border-border">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-foreground">
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label="Select all"
                  checked={currentData.length > 0 && selectedItems.length === currentData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Candidate</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Date &amp; Time</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Score</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              const hasScore = item.testScore !== null && item.testScore !== undefined;
              return (
                <tr key={item.id} className="border-b border-border hover:bg-muted/40">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      aria-label={`Select ${item.candidate}`}
                      checked={isSelected}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.avatar}
                        alt={item.candidate}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{item.candidate}</p>
                        <p className="text-sm text-muted-foreground">Frontend Developer</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <i className={`${getTypeIcon(item.type)} text-foreground/80`} />
                      <span>{item.type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p>{item.date}</p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {hasScore ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-emerald-600">{item.testScore}%</span>
                        <i className="ri-star-fill text-amber-500" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {hasScore && (
                        <button
                          type="button"
                          className="p-2 text-foreground hover:bg-muted/60 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="View score details"
                        >
                          <i className="ri-eye-line" />
                        </button>
                      )}
                      {item.meetUrl && (
                        <a
                          href={item.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-foreground hover:bg-muted/60 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Open meeting link"
                          title="Open meeting link"
                        >
                          <i className="ri-video-line" />
                        </a>
                      )}
                      <button
                        type="button"
                        className="p-2 text-foreground hover:bg-muted/60 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Send email"
                      >
                        <i className="ri-mail-line" />
                      </button>
                      {item.status === 'No Show' && (
                        <button
                          type="button"
                          className="p-2 text-foreground hover:bg-muted/60 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Mark as rejected"
                        >
                          <i className="ri-close-line" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/80">{selectedItems.length} item(s) selected</p>
            <div className="flex space-x-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Send Reminder
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reschedule
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Features */}
      <div className="mt-6 p-4 bg-gradient-to-r from-muted to-muted/60 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-3">HR Feedback &amp; Settings</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Auto-Schedule Next Round</h4>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-muted-foreground">Enable automatic scheduling</span>
            </label>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Test Results</h4>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-foreground hover:text-foreground/80"
            >
              <i className="ri-file-pdf-line" />
              <span>View PDF Reports</span>
            </button>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Feedback Form</h4>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-foreground hover:text-foreground/80"
            >
              <i className="ri-feedback-line" />
              <span>Add HR Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
