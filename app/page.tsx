// app/page.tsx
'use client';

import Hero from '../components/Hero';
import FeaturesCarousel from '../components/FeaturesCarousel';
import LiveStats from '../components/LiveStats';
import Testimonials from '../components/Testimonials';

export default function Home() {
  return (
    // No extra header/footer here — layout.tsx provides the single nav + minimal footer
    // Keep background neutral so sections manage their own look
    <div className="min-h-screen bg-transparent">
      <Hero />
      <FeaturesCarousel />
      <LiveStats />
      <Testimonials />
    </div>
  );
}
