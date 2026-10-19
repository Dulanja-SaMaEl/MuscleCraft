'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import SectionHeader from './motion/SectionHeader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { revealOnScroll } from './motion/scrollReveal';
import { MOTION_TOKENS } from './motion/tokens';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const faqs = [
    {
      question: 'What are the facility operating hours?',
      answer:
        'MuscleCraft operates 24 hours a day, 7 days a week, 365 days a year for active members. Personal training and coaching staff hours are Monday through Saturday from 06:00 to 22:00.',
    },
    {
      question: 'How does the Personal Coaching & Transformation Program work?',
      answer:
        'Upon enrollment, you are directly paired with Coach Adeesha and the MuscleCraft team. Week 1 begins with a comprehensive body assessment, health consultation, and tailored meal and workout plan. Your coach checks in continuously, tracking weight and measurements weekly, refining protocols until your target results are locked in.',
    },
    {
      question: 'How do manual bank transfer payments work?',
      answer:
        'To ensure zero credit card processing surcharges and complete institutional security, we use verified manual bank transfers. When enrolling, our system generates a unique transfer reference code (e.g., TRF-MC-749210). Once your transfer is submitted, our administrative desk verifies the bank receipt and activates your membership.',
    },
    {
      question: 'Can I freeze or pause my membership?',
      answer:
        'Yes. Monthly members and personal coaching clients can request up to a 30-day medical or travel freeze by contacting the administrative desk or coach.',
    },
    {
      question: 'What specialized equipment and coaching tools are provided?',
      answer:
        'Our facility features competition-grade racks, calibrated power plates, specialized isolation machines, personalized tracking dashboards, and tailored nutritional meal planning.',
    },
  ];

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      revealOnScroll(section.querySelectorAll('.faq-item'), {
        trigger: containerRef.current,
        y: 40,
        stagger: 0.1,
        duration: 1.1,
        start: 'top 88%',
      });
    },
    { scope: sectionRef }
  );

  // Slow, luxury accordion: smoothly tweens pixel scrollHeight with power2 curve
  const firstRun = useRef(true);
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const panels = section.querySelectorAll<HTMLElement>('.faq-panel');
      panels.forEach((panel, idx) => {
        const text = panel.querySelector<HTMLElement>('.faq-text');
        const open = openIndex === idx;

        if (firstRun.current) {
          gsap.set(panel, { height: open ? 'auto' : 0, overflow: 'hidden' });
          if (text) gsap.set(text, { opacity: open ? 1 : 0, y: open ? 0 : -8 });
          return;
        }

        if (open) {
          // Temporarily set height auto to measure true scrollHeight
          panel.style.height = 'auto';
          const targetHeight = panel.scrollHeight;
          panel.style.height = '0px';

          gsap.fromTo(
            panel,
            { height: 0 },
            {
              height: targetHeight,
              duration: 0.9,
              ease: 'power2.out',
              overwrite: 'auto',
              onComplete: () => {
                panel.style.height = 'auto';
              },
            }
          );
          if (text) {
            gsap.fromTo(
              text,
              { opacity: 0, y: -10 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: 0.15,
                ease: 'power2.out',
                overwrite: 'auto',
              }
            );
          }
        } else {
          const currentHeight = panel.offsetHeight;
          if (currentHeight > 0) {
            gsap.fromTo(
              panel,
              { height: currentHeight },
              {
                height: 0,
                duration: 0.65,
                ease: 'power2.inOut',
                overwrite: 'auto',
              }
            );
          } else {
            panel.style.height = '0px';
          }
          if (text) {
            gsap.to(text, {
              opacity: 0,
              y: -8,
              duration: 0.35,
              ease: 'power2.in',
              overwrite: 'auto',
            });
          }
        }
      });
      firstRun.current = false;
    },
    { scope: sectionRef, dependencies: [openIndex] }
  );

  return (
    <section
      id="slide-faq"
      ref={sectionRef}
      className="presentation-slide scroll-mt-28 sm:scroll-mt-36 relative w-full overflow-hidden bg-transparent border-t border-white/[0.04] py-20 sm:py-28 lg:py-32"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-4 sm:py-6">
        <SectionHeader
          eyebrow="Clarifications"
          heading="Frequently Asked Questions"
          className="mb-4 sm:mb-6"
        />

        <div ref={containerRef} className="space-y-2.5 sm:space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`faq-item will-change-transform bg-[#101014]/90 border rounded-xl overflow-hidden transition-colors duration-700 backdrop-blur-md ${
                  isOpen
                    ? 'border-crimson-500/50 shadow-[0_0_24px_rgba(186,26,26,0.2)] bg-[#14141a]'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-crimson-400 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="pr-4 flex items-center gap-3">
                    <HelpCircle
                      className={`w-4 h-4 transition-colors duration-700 ${
                        isOpen ? 'text-crimson-500' : 'text-gray-500'
                      }`}
                    />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-700 ease-in-out ${
                      isOpen ? 'rotate-180 text-crimson-400' : 'rotate-0 text-gray-400'
                    }`}
                  />
                </button>

                {/* GSAP controlled slow, silky accordion panel */}
                <div
                  id={`faq-answer-${idx}`}
                  className="faq-panel overflow-hidden"
                >
                  <div className="faq-text px-6 pb-6 pt-1 text-sm text-gray-300 leading-relaxed border-t border-white/[0.04]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
