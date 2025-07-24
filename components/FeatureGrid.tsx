'use client';

import { useState } from 'react';

export default function FeatureGrid() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features = [
    {
      icon: "ri-upload-cloud-2-line",
      title: "Lightning-Fast Resume Processing",
      description: "Upload thousands of resumes in seconds with our cutting-edge AI parsing technology that extracts key information with surgical precision.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      stats: "10,000+ resumes/min"
    },
    {
      icon: "ri-brain-line",
      title: "Neural Matching Algorithm",
      description: "Our AI doesn't just match keywords—it understands context, evaluates potential, and predicts success with human-like intelligence.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      stats: "98% accuracy rate"
    },
    {
      icon: "ri-line-chart-line",
      title: "Predictive Scoring Engine",
      description: "Get crystal-clear candidate scores based on skills, experience, cultural fit, and success probability to make data-driven decisions.",
      gradient: "from-green-500 to-teal-500",
      bgGradient: "from-green-50 to-teal-50",
      stats: "15+ scoring factors"
    },
    {
      icon: "ri-calendar-schedule-line",
      title: "Smart Interview Orchestration",
      description: "Automate your entire interview pipeline with intelligent scheduling, reminder systems, and seamless calendar integration.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      stats: "Zero scheduling conflicts"
    },
    {
      icon: "ri-shield-check-line",
      title: "Advanced Verification Suite",
      description: "Verify credentials, employment history, and references with our integrated background check system powered by trusted data sources.",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50",
      stats: "Real-time verification"
    },
    {
      icon: "ri-team-line",
      title: "Collaborative Decision Hub",
      description: "Unite your hiring team with shared candidate profiles, real-time comments, and collaborative decision-making workflows.",
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50",
      stats: "Team-based hiring"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-6">
            <i className="ri-rocket-line mr-2"></i>
            Complete Recruitment Ecosystem
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hire Excellence</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From resume screening to final interviews, our comprehensive suite of AI-powered tools transforms every aspect of your hiring process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden border border-gray-100 ${
                hoveredIndex === index ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className={`inline-flex w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${feature.icon} text-2xl text-white`}></i>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700">
                  {feature.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {feature.stats}
                  </span>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300"></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Hiring Process?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies already using SmartHirex to find exceptional talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap">
              <i className="ri-rocket-line mr-2"></i>
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 whitespace-nowrap">
              <i className="ri-calendar-line mr-2"></i>
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}