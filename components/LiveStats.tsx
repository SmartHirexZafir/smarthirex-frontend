'use client';

import { useState, useEffect, useRef } from 'react';

export default function LiveStats() {
  const [stats, setStats] = useState({
    resumesFiltered: 12485,
    interviewsScheduled: 1247,
    candidatesHired: 892,
    activePlatforms: 156
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setStats(prev => ({
        resumesFiltered: prev.resumesFiltered + Math.floor(Math.random() * 3) + 1,
        interviewsScheduled: prev.interviewsScheduled + Math.floor(Math.random() * 2),
        candidatesHired: prev.candidatesHired + Math.floor(Math.random() * 2),
        activePlatforms: prev.activePlatforms + Math.floor(Math.random() * 2) - 1
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
      let startTime: number | null = null;
      const startValue = count;
      const endValue = value;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentCount = Math.floor(startValue + (endValue - startValue) * progress);
        setCount(currentCount);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, [value]);

    return <span>{count.toLocaleString()}</span>;
  };

  const items = [
    {
      label: 'Resumes Filtered Today',
      value: stats.resumesFiltered,
      icon: 'ri-file-search-line',
      color: 'from-cyan-400 to-blue-400',
      delay: '0.1s'
    },
    {
      label: 'Interviews Scheduled',
      value: stats.interviewsScheduled,
      icon: 'ri-calendar-check-line',
      color: 'from-purple-400 to-pink-400',
      delay: '0.2s'
    },
    {
      label: 'Successful Hires',
      value: stats.candidatesHired,
      icon: 'ri-user-add-line',
      color: 'from-green-400 to-teal-400',
      delay: '0.3s'
    },
    {
      label: 'Active Companies',
      value: stats.activePlatforms,
      icon: 'ri-building-line',
      color: 'from-orange-400 to-red-400',
      delay: '0.4s'
    }
  ];

  const feed = [
    { action: "Resume filtered", company: "TechCorp", time: "2 seconds ago", icon: "ri-file-search-line", color: "text-cyan-400" },
    { action: "Interview scheduled", company: "StartupXYZ", time: "5 seconds ago", icon: "ri-calendar-check-line", color: "text-purple-400" },
    { action: "Candidate hired", company: "Global Inc", time: "12 seconds ago", icon: "ri-user-add-line", color: "text-green-400" },
    { action: "Test generated", company: "DevCorp", time: "18 seconds ago", icon: "ri-code-s-slash-line", color: "text-orange-400" },
    { action: "Resume filtered", company: "InnovateLab", time: "25 seconds ago", icon: "ri-file-search-line", color: "text-cyan-400" },
    { action: "Interview scheduled", company: "FutureTech", time: "32 seconds ago", icon: "ri-calendar-check-line", color: "text-purple-400" }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      {/* Bubbles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-400 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl opacity-10 animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <i className="ri-pulse-line mr-2"></i>
            Live Activity Dashboard
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Real-Time <span className="text-cyan-300">Hiring Analytics</span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Watch our AI platform work in real-time as companies worldwide discover their perfect candidates.
          </p>
        </div>

        {/* Stats Boxes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center transform transition-all duration-1000 hover:scale-105 hover:bg-white/20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: item.delay }}
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                <i className={`${item.icon} text-2xl text-white`}></i>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                <AnimatedCounter value={item.value} />
              </div>
              <div className="text-blue-200 text-sm uppercase tracking-wider">{item.label}</div>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs">Live</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Feed */}
        <div className={`mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '0.5s' }}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Live Activity Feed</h3>
            <p className="text-blue-200">Real-time updates from the SmartHirex platform</p>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {feed.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 ${item.color}`}>
                  <i className={`${item.icon} text-lg`}></i>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{item.action}</div>
                  <div className="text-blue-200 text-sm">{item.company}</div>
                </div>
                <div className="text-blue-300 text-sm">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
