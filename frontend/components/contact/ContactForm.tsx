'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('90-Day VIP Coaching Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit inquiry. Please try again.');
      }
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {submitted ? (
        <div className="bg-emerald-950/70 border border-emerald-700/70 text-emerald-200 p-8 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Inquiry Transmitted</h3>
          <p className="text-xs text-emerald-200/90 max-w-sm mx-auto leading-relaxed">
            Thank you. Coach Adeesha has received your inquiry via email and a confirmation receipt has been sent to your inbox.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-xs font-semibold text-crimson-400 hover:text-crimson-300 underline pt-2 cursor-pointer min-h-[44px] px-4"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Full Name *
              </label>
              <input
                id="contactName"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors min-h-[44px]"
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
                placeholder="you@example.com"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactPhone" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Phone / WhatsApp
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="contactSubject" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Inquiry Topic
              </label>
              <div className="relative">
                <select
                  id="contactSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="appearance-none w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 pl-3.5 pr-9 py-2.5 rounded-xl text-sm text-white outline-none cursor-pointer transition-colors min-h-[44px]"
                >
                  <option value="90-Day VIP Coaching Inquiry" className="bg-[#18181d]">90-Day VIP Coaching Inquiry</option>
                  <option value="Sole / Couple Gym Membership" className="bg-[#18181d]">Sole / Couple Gym Membership</option>
                  <option value="Manual Bank Transfer Verification" className="bg-[#18181d]">Manual Bank Transfer Verification</option>
                  <option value="Facility Tour Booking" className="bg-[#18181d]">Facility Tour Booking</option>
                  <option value="BurnZone Functional Training" className="bg-[#18181d]">BurnZone Functional Training</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell Coach Adeesha about your primary fitness goals, current roadblocks, or training background..."
              className="w-full bg-[#18181d] border border-white/[0.1] focus:border-crimson-500 p-3.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.4)] flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
          >
            <Send className="w-4 h-4" /> {isSubmitting ? 'Transmitting Inquiry...' : 'Transmit Inquiry to Coach Adeesha'}
          </button>
        </form>
      )}
    </div>
  );
}
