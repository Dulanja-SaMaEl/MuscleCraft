'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Radio,
  Send,
  Smartphone,
  Mail,
  Bell,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  Globe,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { BroadcastAudience, BroadcastChannel, User as UserType } from '@/lib/types';

interface BroadcastTabProps {
  members: UserType[];
  broadcastHistory: any[];
  onSendBroadcast: (broadcastData: any) => Promise<void>;
}

export default function BroadcastTab({
  members,
  broadcastHistory,
  onSendBroadcast,
}: BroadcastTabProps) {
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<BroadcastAudience>('all_members');
  const [targetClientId, setTargetClientId] = useState<string>(
    members.find((m) => m.role === 'client')?.id || 'usr_client_90'
  );
  const [channels, setChannels] = useState<BroadcastChannel[]>(['in_app', 'sms']);
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [isDispatching, setIsDispatching] = useState(false);
  const [previewMode, setPreviewMode] = useState<'in_app' | 'sms' | 'push'>('in_app');

  const clientMembers = members.filter((m) => m.role === 'client');

  const toggleChannel = (channel: BroadcastChannel) => {
    if (channels.includes(channel)) {
      if (channels.length > 1) {
        setChannels(channels.filter((c) => c !== channel));
      }
    } else {
      setChannels([...channels, channel]);
    }
  };

  const calculateRecipients = () => {
    if (audience === 'all_members') return 84;
    if (audience === 'coaching_90_vip') return 19;
    if (audience === 'sole_members') return 42;
    if (audience === 'couple_members') return 23;
    if (audience === 'specific_client') return 1;
    return 84;
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsDispatching(true);
    try {
      const selectedClient = members.find((m) => m.id === targetClientId);
      await onSendBroadcast({
        title: title.trim(),
        body: body.trim(),
        audience,
        targetClientId: audience === 'specific_client' ? targetClientId : undefined,
        targetClientName: audience === 'specific_client' ? selectedClient?.name : undefined,
        channels,
        priority,
      });

      // Reset form
      setTitle('');
      setBody('');
      setPriority('normal');
    } finally {
      setIsDispatching(false);
    }
  };

  const recipientCount = calculateRecipients();

  return (
    <div className="space-y-8">
      {/* ───────────────────────────────────────────────────────────
          1. HEADER & KPI OVERVIEW
          ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-crimson-950/80 border border-crimson-600/40 text-crimson-400">
              <Radio className="w-5 h-5" />
            </span>
            Message Broadcast Center
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Dispatch announcements, emergency facility notices, and coaching reminders across In-App, SMS, Email, and Push.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Broadcast Gateway Ready</span>
          </span>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            Target Reach
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2 block">
            {recipientCount} Athletes
          </span>
          <span className="text-[11px] text-crimson-400 font-semibold mt-1 block">
            Active in current audience
          </span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            Delivery Channels
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2 block">
            {channels.length} Selected
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {channels.join(', ').toUpperCase()}
          </span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            Sent Broadcasts
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2 block">
            {broadcastHistory.length} Dispatched
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 block">100% Delivery rate</span>
        </div>

        <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-2xl">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
            SMS Gateway Status
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-2 block">
            Online
          </span>
          <span className="text-[11px] text-gray-400 mt-1 block">Dialog / Mobitel Core API</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. TWO-COLUMN SPLIT: COMPOSER + DEVICE PREVIEW
          ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COMPOSER FORM (7 Columns) */}
        <div className="lg:col-span-7 bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-crimson-500" />
            <span>Compose Broadcast Announcement</span>
          </h3>

          <form onSubmit={handleDispatch} className="space-y-5">
            {/* Target Audience Selector */}
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">
                1. Select Target Audience:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'all_members', label: 'All Members', count: '84 Athletes', icon: Globe },
                  { id: 'coaching_90_vip', label: '90-Day VIP', count: '19 Athletes', icon: Flame },
                  { id: 'sole_members', label: 'Sole Members', count: '42 Athletes', icon: User },
                  { id: 'couple_members', label: 'Couple Pairs', count: '23 Couples', icon: Users },
                  { id: 'specific_client', label: 'Direct Member', count: '1 Athlete', icon: Sparkles },
                ].map((aud) => {
                  const Icon = aud.icon;
                  const isSelected = audience === aud.id;
                  return (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setAudience(aud.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all min-h-[56px] cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-crimson-950/70 border-crimson-600 text-white shadow-[0_0_15px_rgba(186,26,26,0.3)]'
                          : 'bg-[#161620] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-crimson-400' : 'text-gray-500'}`} />
                        <span className="text-[10px] font-mono text-gray-400">{aud.count}</span>
                      </div>
                      <span className="text-xs font-bold mt-1 block">{aud.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Member Dropdown when selected */}
            {audience === 'specific_client' && (
              <div>
                <label htmlFor="directClientSelect" className="text-xs font-bold text-gray-300 block mb-1.5">
                  Select Recipient Athlete:
                </label>
                <select
                  id="directClientSelect"
                  value={targetClientId}
                  onChange={(e) => setTargetClientId(e.target.value)}
                  className="w-full bg-[#161620] border border-white/10 text-white text-xs font-semibold rounded-xl px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-crimson-500 cursor-pointer"
                >
                  {clientMembers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.packageName || c.tier}) - {c.phone || c.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Delivery Channels */}
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">
                2. Delivery Channels:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'in_app', label: 'In-App Alert', icon: MessageSquare },
                  { id: 'sms', label: 'SMS Gateway', icon: Smartphone },
                  { id: 'email', label: 'Email Blast', icon: Mail },
                  { id: 'push', label: 'Push Alert', icon: Bell },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = channels.includes(ch.id as any);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all min-h-[48px] cursor-pointer flex items-center justify-center gap-2 ${
                        isChecked
                          ? 'bg-crimson-950/70 border-crimson-600 text-white shadow-md'
                          : 'bg-[#161620] border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isChecked ? 'text-crimson-400' : 'text-gray-500'}`} />
                      <span className="text-xs font-bold">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Broadcast Title / Headline */}
            <div>
              <label htmlFor="broadcastTitle" className="text-xs font-bold text-gray-300 block mb-1.5">
                3. Announcement Headline:
              </label>
              <input
                id="broadcastTitle"
                type="text"
                required
                placeholder="e.g. Special Holiday Hours / Weekend Functional Conditioning Clinic"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#161620] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 min-h-[44px]"
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="broadcastBody" className="text-xs font-bold text-gray-300 block">
                  4. Message Body Content:
                </label>
                <span className="text-[11px] font-mono text-gray-400">
                  {body.length} / 500 chars · {Math.ceil((body.length || 1) / 160)} SMS segment
                </span>
              </div>
              <textarea
                id="broadcastBody"
                required
                rows={4}
                placeholder="Attention MuscleCraft members: The main facility will operate on holiday schedule this weekend..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-[#161620] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-crimson-500 resize-none leading-relaxed"
              />
            </div>

            {/* Priority Selector */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">Priority:</span>
                {(['normal', 'high', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors min-h-[36px] ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-rose-600 text-white'
                          : p === 'high'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isDispatching || !title.trim() || !body.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-crimson-600 to-rose-600 hover:from-crimson-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(186,26,26,0.5)] min-h-[44px] flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isDispatching
                    ? 'Broadcasting...'
                    : `Dispatch to ${recipientCount} Athletes`}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* DEVICE LIVE PREVIEW (5 Columns) */}
        <div className="lg:col-span-5 bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-crimson-500" />
                <span>Live Member Device Preview</span>
              </h3>

              {/* Preview mode pills */}
              <div className="flex items-center bg-[#181822] p-0.5 rounded-lg border border-white/5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewMode('in_app')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    previewMode === 'in_app' ? 'bg-crimson-600 text-white' : 'text-gray-400'
                  }`}
                >
                  In-App
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('sms')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    previewMode === 'sms' ? 'bg-crimson-600 text-white' : 'text-gray-400'
                  }`}
                >
                  SMS
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('push')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    previewMode === 'push' ? 'bg-crimson-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Push
                </button>
              </div>
            </div>

            {/* Smartphone Shell Mockup */}
            <div className="relative mx-auto max-w-[320px] w-full rounded-[38px] border-4 border-[#242430] bg-[#09090c] p-4 shadow-2xl overflow-hidden aspect-[9/18]">
              {/* Dynamic Island / Camera Notch */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-4 border border-white/10" />

              {/* Status bar */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 px-2 mb-4 font-mono">
                <span>09:41</span>
                <span>5G · 100%</span>
              </div>

              {/* Preview Content based on mode */}
              {previewMode === 'in_app' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black tracking-wider uppercase text-white">
                      Muscle<span className="text-crimson-500">Craft</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-crimson-950 text-crimson-400 border border-crimson-800 font-bold">
                      VIP PORTAL
                    </span>
                  </div>

                  {/* Broadcast Banner Card */}
                  <div
                    className={`p-3.5 rounded-2xl border shadow-lg ${
                      priority === 'urgent'
                        ? 'bg-rose-950/80 border-rose-600 text-white'
                        : priority === 'high'
                        ? 'bg-amber-950/80 border-amber-600 text-white'
                        : 'bg-gradient-to-br from-crimson-950/90 to-[#121218] border-crimson-600 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-crimson-300 uppercase tracking-wider">
                      <Radio className="w-3 h-3 text-crimson-400" />
                      <span>Facility Announcement</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-white leading-tight">
                      {title || 'Announcement Headline Appears Here'}
                    </h4>
                    <p className="text-[11px] text-gray-200 mt-1.5 leading-relaxed line-clamp-4">
                      {body ||
                        'Your message body will be rendered on members screens across our progressive web app.'}
                    </p>
                    <div className="mt-2 text-[9px] text-gray-400 flex items-center justify-between pt-2 border-t border-white/10 font-mono">
                      <span>Coach Adeesha Kumarasingha</span>
                      <span>Just now</span>
                    </div>
                  </div>

                  {/* Dummy Feed Below */}
                  <div className="bg-[#15151c] p-3 rounded-xl border border-white/5 opacity-60">
                    <div className="w-20 h-2 bg-gray-600 rounded mb-2"></div>
                    <div className="w-full h-12 bg-black/40 rounded-lg"></div>
                  </div>
                </div>
              )}

              {previewMode === 'sms' && (
                <div className="space-y-3">
                  <div className="text-center pt-2 pb-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-crimson-900 border border-crimson-600 mx-auto flex items-center justify-center text-white font-bold text-xs mb-1">
                      MC
                    </div>
                    <span className="text-xs font-bold text-white block">MuscleCraft</span>
                    <span className="text-[9px] text-gray-500">SMS Gateway · Dialog</span>
                  </div>

                  {/* Incoming SMS Bubble */}
                  <div className="bg-[#1f1f2e] text-white p-3 rounded-2xl rounded-tl-sm border border-white/10 shadow-md">
                    <span className="text-[10px] font-bold text-crimson-400 uppercase tracking-wider block mb-1">
                      {title || 'MuscleCraft Update'}
                    </span>
                    <p className="text-[11px] text-gray-200 leading-relaxed">
                      {body || 'Your message will appear here as a direct SMS notification.'}
                    </p>
                    <span className="text-[9px] text-gray-500 mt-1.5 block text-right font-mono">
                      09:41 AM · Sent
                    </span>
                  </div>
                </div>
              )}

              {previewMode === 'push' && (
                <div className="space-y-3 pt-6">
                  <div className="text-center mb-6">
                    <span className="text-2xl font-light text-white font-mono">09:41</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Tuesday, October 27</span>
                  </div>

                  {/* Lock Screen Notification Pill */}
                  <div className="bg-[#181824]/90 backdrop-blur border border-white/15 p-3 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded bg-crimson-600 flex items-center justify-center text-white font-bold text-[8px]">
                          M
                        </div>
                        <span className="font-bold text-white">MUSCLECRAFT</span>
                      </div>
                      <span>now</span>
                    </div>
                    <h5 className="text-[11px] font-bold text-white leading-tight">
                      {title || 'Announcement Headline'}
                    </h5>
                    <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {body || 'Message notification text on mobile device lock screen.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. BROADCAST DISPATCH HISTORY TABLE
          ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#111116] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-crimson-500" />
              <span>Broadcast Dispatch History</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Record of past announcements sent across channels with recipient metrics.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {broadcastHistory.length} Announcements Dispatched
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Subject & Content</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {broadcastHistory.map((bc) => (
                <tr key={bc.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gray-400 whitespace-nowrap">
                    {new Date(bc.createdAt).toLocaleDateString()}{' '}
                    <span className="text-[10px] block text-gray-500">
                      {new Date(bc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <span className="font-bold text-white block line-clamp-1">{bc.title}</span>
                    <span className="text-gray-400 text-[11px] line-clamp-2 mt-0.5">
                      {bc.body}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-crimson-950 text-crimson-300 border border-crimson-800 text-[10.5px] font-bold">
                      {bc.audience.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {bc.channels.map((ch: string) => (
                        <span
                          key={ch}
                          className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 text-[10px] font-mono font-bold uppercase"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {bc.recipientCount} Athletes
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      100% Delivered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
