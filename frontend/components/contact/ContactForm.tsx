'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
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
    <div>
      {submitted ? (
        <div className="bg-green-950/80 border border-green-700 text-green-200 p-8 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Message Transmitted</h3>
          <p className="text-xs text-green-300 max-w-sm mx-auto">
            Thank you. Coach Adeesha or a MuscleCraft team member will contact you within 24 business hours.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-xs font-semibold text-crimson-400 hover:text-crimson-300 underline pt-2 cursor-pointer"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Full Name *
              </label>
              <input
                id="contactName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Email Address *
              </label>
              <input
                id="contactEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactPhone" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Phone Number
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="contactSubject" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Inquiry Topic
              </label>
              <select
                id="contactSubject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white outline-none cursor-pointer transition-colors"
              >
                <option value="90-Day VIP Coaching Inquiry">90-Day VIP Coaching Inquiry</option>
                <option value="Sole / Couple Gym Membership">Sole / Couple Gym Membership</option>
                <option value="Manual Bank Transfer Verification">Manual Bank Transfer Verification</option>
                <option value="Facility Tour Booking">Facility Tour Booking</option>
                <option value="BurnZone Functional Training">BurnZone Functional Training</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="contactMessage" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              Message *
            </label>
            <textarea
              id="contactMessage"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell Coach Adeesha about your primary fitness goals, current roadblocks, or training background..."
              className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 p-3.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Transmit Inquiry to Coach Adeesha
          </button>
        </form>
      )}
    </div>
  );
}
