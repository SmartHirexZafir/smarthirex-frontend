// app/page.tsx
'use client';

import Hero from '../components/Hero';
import FeaturesCarousel from '../components/FeaturesCarousel';
import LiveStats from '../components/LiveStats';
import Testimonials from '../components/Testimonials';

export default function Home() {
  return (
    // Footer is rendered globally in layout.tsx.
    // Avoid min-h-screen here so the global footer remains visible without extra scroll.
    <div className="bg-transparent">
      <Hero />
      <FeaturesCarousel />
      <LiveStats />
      <Testimonials />
    </div>
  );
}
