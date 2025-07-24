
'use client';

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp Solutions",
      image: "https://readdy.ai/api/search-image?query=professional%20female%20HR%20director%20headshot%2C%20confident%20business%20woman%2C%20modern%20corporate%20portrait%2C%20professional%20headshot%20photography%2C%20business%20executive%20portrait%2C%20clean%20professional%20background%2C%20corporate%20leadership%20photography%2C%20modern%20workplace%20professional&width=400&height=400&seq=testimonial-001&orientation=squarish",
      quote: "SmartHirex reduced our hiring time by 60% and improved candidate quality significantly. The AI matching is incredibly accurate."
    },
    {
      name: "Michael Chen",
      role: "Talent Acquisition Manager",
      company: "Global Innovations Inc",
      image: "https://readdy.ai/api/search-image?query=professional%20male%20talent%20acquisition%20manager%20headshot%2C%20confident%20business%20man%2C%20modern%20corporate%20portrait%2C%20professional%20headshot%20photography%2C%20business%20executive%20portrait%2C%20clean%20professional%20background%2C%20corporate%20leadership%20photography%2C%20modern%20workplace%20professional&width=400&height=400&seq=testimonial-002&orientation=squarish",
      quote: "The automated resume screening saved us hundreds of hours. We can now focus on building relationships with top candidates."
    },
    {
      name: "Emily Rodriguez",
      role: "Recruitment Lead",
      company: "StartupHub Ventures",
      image: "https://readdy.ai/api/search-image?query=professional%20female%20recruitment%20lead%20headshot%2C%20confident%20business%20woman%2C%20modern%20corporate%20portrait%2C%20professional%20headshot%20photography%2C%20business%20executive%20portrait%2C%20clean%20professional%20background%2C%20corporate%20leadership%20photography%2C%20modern%20workplace%20professional&width=400&height=400&seq=testimonial-003&orientation=squarish",
      quote: "SmartHirex's AI-powered matching helped us find perfect candidates we would have missed with traditional methods."
    }
  ];

  const stats = [
    { number: "50+", label: "Companies Trust Us" },
    { number: "10,000+", label: "Resumes Processed" },
    { number: "60%", label: "Faster Hiring" },
    { number: "95%", label: "Accuracy Rate" }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Leading Companies
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of HR professionals who have transformed their recruitment process with SmartHirex.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <img 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-blue-700">{testimonial.company}</p>
                </div>
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-8">
            Join the Future of Recruitment
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
          <button className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
}
