import Navbar from '@/components/Navbar';
import ScrollFrameSequence from '@/components/motion/ScrollFrameSequence';
import MarqueeStrip from '@/components/MarqueeStrip';
import ElevateJourney from '@/components/ElevateJourney';
import WhatWeOffer from '@/components/WhatWeOffer';
import AboutSection from '@/components/AboutSection';
import PricingSection from '@/components/PricingSection';
import ReviewsSection from '@/components/ReviewsSection';
import BannerSection from '@/components/BannerSection';
import FaqSection from '@/components/FaqSection';
import ContactMapSlide from '@/components/ContactMapSlide';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import SmoothScroll from '@/components/motion/SmoothScroll';

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="relative flex flex-col min-h-screen bg-[#080809] text-gray-100 overflow-x-clip selection:bg-[#D4A359]/30 selection:text-white">
        {/* Custom desktop-only kinetic gold dot + trailing ring cursor */}
        <CustomCursor />

        {/* Floating centered pill navbar with scroll shrink & preserved Live Persona switcher */}
        <Navbar />

        {/* Main cinematic motion sections */}
        <main className="relative z-10 w-full flex flex-col">
          {/* 1. Cinematic 3D Scrollytelling Frame Sequence (Hero with fallback to 3D Barbell/Video Hero) */}
          <ScrollFrameSequence />

          {/* 2. Infinite Marquee Strip under the hero with site vocabulary (pauses on hover) */}
          <MarqueeStrip />

          {/* 3. Elevate Your Journey: Split layout, ImageReveal with parallax, 6 checklist items */}
          <ElevateJourney />

          {/* 4. What We Offer: Darkened video background slot "bar", liquid-glass cards, popping icons */}
          <WhatWeOffer />

          {/* 5. About Us: Philosophy, 3-photo gallery with staggered ImageReveal & parallax */}
          <AboutSection />

          {/* 6. Pricing: Liquid-glass cards, flagship with slow animated gold border & unobstructed title */}
          <PricingSection />

          {/* 7. Reviews: Liquid-glass cards sliding from right with stagger, stars filling one by one */}
          <ReviewsSection />

          {/* 8. CTA Banner: "forge" video background behind scroll-scrubbed text brightening on scroll */}
          <BannerSection />

          {/* 9. Frequently Asked Questions: Accordion with smooth height transitions */}
          <FaqSection />

          {/* 10. Visit Us: Contact cards & DTLA interactive location map */}
          <ContactMapSlide />

          {/* 11. Footer: Staggered columns, newsletter subscription, and social links */}
          <Footer />
        </main>
      </div>
    </SmoothScroll>
  );
}
