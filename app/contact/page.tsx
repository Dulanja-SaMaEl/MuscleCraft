'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import MapSection from '@/components/MapSection';
import { Send, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('90-Day VIP Coaching Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 lg:pt-32">
        {/* Contact Info Grid from Reference Image */}
        <ContactSection />

        {/* Interactive Inquiry Form */}
        <section className="py-16 bg-[#0c0c0f] border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#121215] border border-white/[0.08] p-8 sm:p-10 rounded-lg shadow-card-dark">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
                  Athlete Support Desk
                </span>
                <h2
                  style={{
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                  className="text-[28px] sm:text-[34px] text-white tracking-tight mt-3 leading-tight"
                >
                  Send Direct Inquiry
                </h2>
                <p className="text-xs text-gray-400 mt-1 font-normal">
                  Have specific questions regarding our facility, equipment specifications, or coaching roster?
                </p>
              </div>

              {submitted ? (
                <div className="bg-green-950/80 border border-green-700 text-green-200 p-8 rounded-lg text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                  <h3 className="text-lg font-bold text-white">Message Transmitted</h3>
                  <p className="text-xs text-green-300 max-w-sm mx-auto">
                    Thank you. An IronForge coach or administrator will contact you within 24 business hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-semibold text-gold underline pt-2"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Marcus Vance"
                        className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="athlete@example.com"
                        className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white placeholder-gray-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                        Inquiry Topic
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 rounded text-sm text-white outline-none"
                      >
                        <option value="90-Day VIP Coaching Inquiry">90-Day VIP Coaching Inquiry</option>
                        <option value="Monthly Gym Membership">Monthly Gym Membership</option>
                        <option value="Manual Bank Transfer Verification">Manual Bank Transfer Verification</option>
                        <option value="Facility Tour Booking">Facility Tour Booking</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your background, current lifting numbers, or specific questions."
                      className="w-full bg-[#18181d] border border-white/[0.1] focus:border-gold p-3.5 rounded text-sm text-white placeholder-gray-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#D4A359] hover:bg-[#C2934B] text-[#111111] font-semibold text-[13px] sm:text-[14px] uppercase tracking-wider rounded transition-all duration-200 shadow-md hover:shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Transmit Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Location Map Banner from Reference Image */}
        <MapSection />
      </main>

      <Footer />
    </div>
  );
}
