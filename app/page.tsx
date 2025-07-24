
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import FeaturesCarousel from '../components/FeaturesCarousel';
import LiveStats from '../components/LiveStats';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <FeaturesCarousel />
      <LiveStats />
      <Testimonials />
      <Footer />
    </div>
  );
}