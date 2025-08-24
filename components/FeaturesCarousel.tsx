'use client';

import { useState, useEffect } from 'react';

export default function FeaturesCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use theme tones instead of hard-coded Tailwind blues/purples
  const features = [
    {
      title: 'AI Resume Screening',
      description:
        'Upload thousands of resumes and let our AI instantly identify the best candidates with 98% accuracy.',
      icon: 'ri-brain-line',
      tone: 'info' as const,
    },
    {
      title: 'Smart Candidate Matching',
      description:
        'Advanced algorithms that understand context and match candidates based on skills, experience, and culture fit.',
      icon: 'ri-user-search-line',
      tone: 'accent' as const,
    },
    {
      title: 'Automated Interview Scheduling',
      description:
        'Seamlessly schedule interviews with Google Meet integration and AI-powered time slot optimization.',
      icon: 'ri-calendar-check-line',
      tone: 'success' as const,
    },
    {
      title: 'Intelligent Test Generation',
      description:
        'Create custom skill assessments and coding challenges tailored to specific roles in seconds.',
      icon: 'ri-code-s-slash-line',
      tone: 'warning' as const,
    },
    {
      title: 'Real-time Analytics',
      description:
        'Get instant insights into your hiring pipeline with comprehensive analytics and reporting.',
      icon: 'ri-bar-chart-box-line',
      tone: 'secondary' as const,
    },
  ];

  // Map tone -> gradient + soft background using design tokens
  const toneStyles: Record<
    string,
    { grad: string; soft: string; iconFg: string }
  > = {
    info: {
      grad:
        'from-[hsl(var(--info))] to-[hsl(var(--primary))]',
      soft: 'bg-[hsl(var(--info)/0.08)]',
      iconFg: 'text-[hsl(var(--info))]',
    },
    accent: {
      grad:
        'from-[hsl(var(--accent))] to-[hsl(var(--primary))]',
      soft: 'bg-[hsl(var(--accent)/0.08)]',
      iconFg: 'text-[hsl(var(--accent))]',
    },
    success: {
      grad:
        'from-[hsl(var(--success))] to-[hsl(var(--primary))]',
      soft: 'bg-[hsl(var(--success)/0.08)]',
      iconFg: 'text-[hsl(var(--success))]',
    },
    warning: {
      grad:
        'from-[hsl(var(--warning))] to-[hsl(var(--accent))]',
      soft: 'bg-[hsl(var(--warning)/0.10)]',
      iconFg: 'text-[hsl(var(--warning))]',
    },
    secondary: {
      grad:
        'from-[hsl(var(--secondary))] to-[hsl(var(--accent))]',
      soft: 'bg-[hsl(var(--secondary)/0.10)]',
      iconFg: 'text-[hsl(var(--secondary))]',
    },
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <section className="py-24 bg-background">
      <div className="container">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass text-[hsl(var(--muted-foreground))] text-sm font-medium mb-6 gap-2">
            <i className="ri-magic-line" aria-hidden="true"></i>
            <span>Why Choose SmartHirex?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Supercharge Your <span className="gradient-text">Hiring Process</span>
          </h2>
          <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            Experience the future of recruitment with AI-powered tools that transform how you find, evaluate, and hire top talent.
          </p>
        </div>

        <div className="relative">
          {/* Main Carousel */}
          <div className="overflow-hidden rounded-3xl glass-strong ring-1 ring-border shadow-soft">
            <div
              className="flex transition-transform duration-700 ease-lux"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              aria-live="polite"
            >
              {features.map((feature, index) => {
                const tone = toneStyles[feature.tone];
                const query = encodeURIComponent(
                  `modern professional ${feature.title.toLowerCase()} interface dashboard showing AI powered recruitment technology, sleek business software design with charts and data visualization, clean modern workspace with holographic displays, futuristic HR management system interface, professional technology platform with gradient backgrounds, advanced artificial intelligence hiring tools visualization, sophisticated recruitment analytics dashboard`
                );
                const imgSrc = `https://readdy.ai/api/search-image?query=${query}&width=600&height=400&seq=feature-carousel-${index}&orientation=landscape`;

                return (
                  <div key={index} className={`w-full flex-shrink-0 ${tone.soft} p-10 md:p-14`}>
                    <div className="grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
                      {/* Text */}
                      <div className="text-center md:text-left">
                        <div
                          className={`inline-flex w-16 h-16 md:w-20 md:h-20 rounded-2xl items-center justify-center mb-6 md:mb-8 shadow-soft bg-gradient-to-r ${tone.grad}`}
                          role="img"
                          aria-label={`${feature.title} icon`}
                        >
                          <i className={`${feature.icon} text-2xl md:text-3xl text-white`} />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
                          {feature.title}
                        </h3>
                        <p className="text-base md:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed mb-6 md:mb-8">
                          {feature.description}
                        </p>
                        <button className="btn btn-outline">
                          Learn More
                        </button>
                      </div>

                      {/* Image */}
                      <div className="relative">
                        <div
                          className={`absolute -inset-4 rounded-3xl blur opacity-25 bg-gradient-to-r ${tone.grad}`}
                          aria-hidden="true"
                        />
                        <img
                          src={imgSrc}
                          alt={feature.title}
                          className="relative w-full h-72 md:h-80 object-cover rounded-2xl ring-1 ring-border shadow-soft"
                          loading={index === currentSlide ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Dots (a11y improved) */}
          <div className="flex justify-center mt-8 space-x-3" role="tablist" aria-label="Feature slides">
            {features.map((f, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`w-3.5 h-3.5 rounded-full ring-1 ring-border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]
                  ${index === currentSlide ? 'bg-[hsl(var(--primary))] scale-110' : 'bg-muted hover:bg-muted/80'}
                `}
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Go to slide ${index + 1}: ${f.title}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={() =>
              setCurrentSlide(currentSlide === 0 ? features.length - 1 : currentSlide - 1)
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/90 backdrop-blur ring-1 ring-border shadow-soft flex items-center justify-center hover:bg-background transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <i className="ri-arrow-left-line text-xl text-foreground/80"></i>
            <span className="sr-only">Previous</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((currentSlide + 1) % features.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/90 backdrop-blur ring-1 ring-border shadow-soft flex items-center justify-center hover:bg-background transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <i className="ri-arrow-right-line text-xl text-foreground/80"></i>
            <span className="sr-only">Next</span>
          </button>
        </div>
      </div>
    </section>
  );
}
