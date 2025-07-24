'use client';

import { useState, useEffect } from 'react';

export default function FeaturesCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      title: "AI Resume Screening",
      description: "Upload thousands of resumes and let our AI instantly identify the best candidates with 98% accuracy.",
      icon: "ri-brain-line",
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
      title: "Smart Candidate Matching",
      description: "Advanced algorithms that understand context and match candidates based on skills, experience, and culture fit.",
      icon: "ri-user-search-line",
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50"
    },
    {
      title: "Automated Interview Scheduling",
      description: "Seamlessly schedule interviews with Google Meet integration and AI-powered time slot optimization.",
      icon: "ri-calendar-check-line",
      gradient: "from-green-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-green-50 to-teal-50"
    },
    {
      title: "Intelligent Test Generation",
      description: "Create custom skill assessments and coding challenges tailored to specific roles in seconds.",
      icon: "ri-code-s-slash-line",
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-gradient-to-br from-orange-50 to-red-50"
    },
    {
      title: "Real-time Analytics",
      description: "Get instant insights into your hiring pipeline with comprehensive analytics and reporting.",
      icon: "ri-bar-chart-box-line",
      gradient: "from-indigo-500 to-purple-500",
      bgColor: "bg-gradient-to-br from-indigo-50 to-purple-50"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <i className="ri-magic-line mr-2"></i>
            Why Choose SmartHirex?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Supercharge Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hiring Process</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of recruitment with AI-powered tools that transform how you find, evaluate, and hire top talent.
          </p>
        </div>

        <div className="relative">
          {/* Main Carousel */}
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div key={index} className={`w-full flex-shrink-0 ${feature.bgColor} p-12 md:p-16`}>
                  <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    <div className="text-center md:text-left">
                      <div className={`inline-flex w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl items-center justify-center mb-8 shadow-lg`}>
                        <i className={`${feature.icon} text-3xl text-white`}></i>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        {feature.description}
                      </p>
                      <button className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap">
                        Learn More
                      </button>
                    </div>
                    
                    <div className="relative">
                      <div className={`absolute -inset-4 bg-gradient-to-r ${feature.gradient} rounded-3xl blur opacity-20`}></div>
                      <img 
                        src={`https://readdy.ai/api/search-image?query=modern%20professional%20$%7Bfeature.title.toLowerCase%28%29%7D%20interface%20dashboard%20showing%20AI%20powered%20recruitment%20technology%2C%20sleek%20business%20software%20design%20with%20charts%20and%20data%20visualization%2C%20clean%20modern%20workspace%20with%20holographic%20displays%2C%20futuristic%20HR%20management%20system%20interface%2C%20professional%20technology%20platform%20with%20gradient%20backgrounds%2C%20advanced%20artificial%20intelligence%20hiring%20tools%20visualization%2C%20sophisticated%20recruitment%20analytics%20dashboard&width=600&height=400&seq=feature-carousel-${index}&orientation=landscape`}
                        alt={feature.title}
                        className="relative w-full h-80 object-cover rounded-2xl shadow-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-3">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-blue-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide(currentSlide === 0 ? features.length - 1 : currentSlide - 1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600"></i>
          </button>
          <button
            onClick={() => setCurrentSlide((currentSlide + 1) % features.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <i className="ri-arrow-right-line text-xl text-gray-600"></i>
          </button>
        </div>
      </div>
    </section>
  );
}