// app/page.tsx
'use client';

import Hero from '../components/Hero';
import FeaturesCarousel from '../components/FeaturesCarousel';
import LiveStats from '../components/LiveStats';
import Testimonials from '../components/Testimonials';

export default function Home() {
  return (
    // Single footer is rendered globally in layout.tsx — do not duplicate locally
    <div className="min-h-screen bg-transparent">
      <Hero />
      <FeaturesCarousel />
      <LiveStats />
      <Testimonials />
    </div>
  );
}
