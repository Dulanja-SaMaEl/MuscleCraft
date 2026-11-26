'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Pencil,
  Save,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  Shield,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { User, UserRole, UserStatus } from '@/lib/types';

interface EditMemberModalProps {
  member: User;
  coaches: User[];
  currentUserId?: string;
  onClose: () => void;
  onSave: (payload: {
    memberId: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    tier: string;
    status: UserStatus;
    membershipExpiresAt: string | null;
    instructorId: string | null;
    assignedInstructorName: string | null;
    newPassword?: string;
  }) => Promise<void>;
}

const PACKAGE_OPTIONS = [
  { value: 'sole_1m', label: 'Sole - 1 Month (30d)', days: 30 },
  { value: 'sole_3m', label: 'Sole - 3 Months (90d)', days: 90 },
  { value: 'sole_6m', label: 'Sole - 6 Months (180d)', days: 180 },
  { value: 'sole_1y', label: 'Sole - 1 Year (365d)', days: 365 },
  { value: 'couple_1m', label: 'Couple - 1 Month (30d)', days: 30 },
  { value: 'couple_3m', label: 'Couple - 3 Months (90d)', days: 90 },
  { value: 'couple_6m', label: 'Couple - 6 Months (180d)', days: 180 },
  { value: 'couple_1y', label: 'Couple - 1 Year (365d)', days: 365 },
  { value: 'coaching_90', label: '90-Day Better Me VIP Coaching (90d)', days: 90 },
  { value: 'burnzone', label: 'MuscleCraft BurnZone Conditioning (30d)', days: 30 },
  { value: 'none', label: 'No Active Plan', days: 0 },
];

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    return iso.slice(0, 10);
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function addDaysFromDateOrNow(currentDateStr: string, days: number): string {
  const base = currentDateStr ? new Date(`${currentDateStr}T12:00:00Z`) : new Date();
  const effectiveBase = isNaN(base.getTime()) || base.getTime() < Date.now() ? new Date() : base;
  const target = new Date(effectiveBase.getTime() + days * 24 * 60 * 60 * 1000);
  return toDateInputValue(target.toISOString());
}

export default function EditMemberModal({
  member,
  coaches,
  currentUserId,
  onClose,
  onSave,
}: EditMemberModalProps) {
  const isSelf = Boolean(currentUserId && member.id === currentUserId);

  const [name, setName] = useState(member.name || '');
  const [email, setEmail] = useState(member.email || '');
  const [phone, setPhone] = useState(member.phone || '');
  const [role, setRole] = useState<UserRole>(member.role || 'client');
  const [status, setStatus] = useState<UserStatus>(member.status || 'active');
  const [tier, setTier] = useState<string>(member.tier || 'none');
  const [expiryDate, setExpiryDate] = useState<string>(toDateInputValue(member.membershipExpiresAt));
  const [instructorId, setInstructorId] = useState<string>(member.assignedInstructorId || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (!email.trim().includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (newPassword.trim().length > 0 && newPassword.trim().length < 6) {
      setErrorMsg('New password must be at least 6 characters (or leave blank to keep current password).');
      return;
    }

    setIsSaving(true);
    try {
      const selectedCoach = coaches.find((c) => c.id === instructorId);
      await onSave({
        memberId: member.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: isSelf ? member.role : role,
        tier,
        status: isSelf ? 'active' : status,
        membershipExpiresAt: expiryDate ? `${expiryDate}T12:00:00.000Z` : null,
        instructorId: role === 'client' ? (instructorId || null) : null,
        assignedInstructorName:
          role === 'client'
            ? selectedCoach?.name || (instructorId ? member.assignedInstructorName || null : null)
            : null,
        ...(newPassword.trim().length >= 6 ? { newPassword: newPassword.trim() } : {}),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save member details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-[#111116] border border-crimson-800/60 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#15151e]">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
              alt={member.name}
              className="w-10 h-10 rounded-xl object-cover border border-crimson-500/40 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="edit-member-title" className="text-base sm:text-lg font-bold text-white truncate">
                  Edit Member Details
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-gray-300 shrink-0">
                  {member.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {member.email} · Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.06] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700/70 text-rose-200 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSelf && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-[11px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You are editing your own administrator profile. Role and active status are locked to prevent accidental self-lockout.</span>
            </div>
          )}

          {/* Row 1: Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-member-name" className="text-xs font-bold text-gray-300 block mb-1.5">
                Full Name *
              </label>
              <input
                id="edit-member-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Member full name"
                className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="edit-member-email" className="text-xs font-bold text-gray-300 block mb-1.5">
                Email Address *
              </label>
              <input
                id="edit-member-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px]"
              />
            </div>
          </div>

          {/* Row 2: Phone & Account Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-member-phone" className="text-xs font-bold text-gray-300 block mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                id="edit-member-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 76 591 7189"
                className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white font-mono focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="edit-member-role" className="text-xs font-bold text-gray-300 block mb-1.5">
                Account Role
              </label>
              <div className="relative">
                <select
                  id="edit-member-role"
                  value={role}
                  disabled={isSelf}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="appearance-none w-full pl-3.5 pr-9 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px] disabled:opacity-50 cursor-pointer"
                >
                  <option value="client" className="bg-[#161620]">Athlete / Client</option>
                  <option value="instructor" className="bg-[#161620]">Coach / Instructor</option>
                  <option value="admin" className="bg-[#161620]">Administrator</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Status & Package Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-member-status" className="text-xs font-bold text-gray-300 block mb-1.5">
                Portal Access Status
              </label>
              <div className="relative">
                <select
                  id="edit-member-status"
                  value={status}
                  disabled={isSelf}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                  className="appearance-none w-full pl-3.5 pr-9 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px] disabled:opacity-50 cursor-pointer"
                >
                  <option value="active" className="bg-[#161620]">Active (Full Portal Access)</option>
                  <option value="pending" className="bg-[#161620]">Pending Package / Verification</option>
                  <option value="suspended" className="bg-[#161620]">Banned / Suspended</option>
                  <option value="expired" className="bg-[#161620]">Expired (Deactivated)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="edit-member-tier" className="text-xs font-bold text-gray-300 block mb-1.5">
                Membership Package / Tier
              </label>
              <div className="relative">
                <select
                  id="edit-member-tier"
                  value={PACKAGE_OPTIONS.some((o) => o.value === tier) ? tier : 'sole_1m'}
                  onChange={(e) => {
                    const nextTier = e.target.value;
                    setTier(nextTier);
                    const opt = PACKAGE_OPTIONS.find((o) => o.value === nextTier);
                    if (opt && opt.days > 0 && !expiryDate) {
                      setExpiryDate(addDaysFromDateOrNow('', opt.days));
                    }
                  }}
                  className="appearance-none w-full pl-3.5 pr-9 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px] cursor-pointer"
                >
                  {PACKAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#161620]">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 4: Expiry Date & Assigned Coach */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-member-expiry" className="text-xs font-bold text-gray-300 block mb-1.5">
                Membership Expiration Date
              </label>
              <div className="relative">
                <input
                  id="edit-member-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white font-mono focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px] [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setExpiryDate(addDaysFromDateOrNow(expiryDate, 30))}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-[10px] font-mono text-gray-300 hover:text-white cursor-pointer transition-colors"
                >
                  +30d
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryDate(addDaysFromDateOrNow(expiryDate, 90))}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-[10px] font-mono text-gray-300 hover:text-white cursor-pointer transition-colors"
                >
                  +90d
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryDate(addDaysFromDateOrNow(expiryDate, 365))}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-[10px] font-mono text-gray-300 hover:text-white cursor-pointer transition-colors"
                >
                  +1 Yr
                </button>
                {expiryDate && (
                  <button
                    type="button"
                    onClick={() => setExpiryDate('')}
                    className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/40 text-[10px] font-mono text-rose-300 cursor-pointer transition-colors ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="edit-member-coach" className="text-xs font-bold text-gray-300 block mb-1.5">
                Assigned Coach
              </label>
              <div className="relative">
                <select
                  id="edit-member-coach"
                  value={instructorId}
                  disabled={role !== 'client'}
                  onChange={(e) => setInstructorId(e.target.value)}
                  className="appearance-none w-full pl-3.5 pr-9 py-2.5 bg-[#161620] border border-white/10 rounded-xl text-xs text-white focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[44px] disabled:opacity-50 cursor-pointer"
                >
                  <option value="" className="bg-[#161620]">
                    {role === 'client' ? 'Coach Adeesha (Default Head Coach)' : 'Staff Account (No Coach Assigned)'}
                  </option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#161620]">
                      {c.name} ({c.role === 'admin' ? 'Owner / Head Coach' : 'Coach'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                {role === 'client'
                  ? 'Determines which coach oversees this athlete’s workouts and check-ins.'
                  : 'Staff accounts do not require an assigned coach.'}
              </p>
            </div>
          </div>

          {/* Row 5: Optional Password Reset */}
          <div className="p-4 rounded-2xl bg-[#161620]/70 border border-white/[0.06] space-y-2">
            <label htmlFor="edit-member-password" className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-crimson-400" />
              Reset Login Password <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                id="edit-member-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep existing password (min 6 chars)"
                autoComplete="new-password"
                className="w-full pl-3.5 pr-11 py-2.5 bg-[#111116] border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:border-crimson-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-500/40 min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.04] text-xs font-bold cursor-pointer min-h-[42px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(186,26,26,0.4)] flex items-center gap-2 cursor-pointer min-h-[42px] transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Member Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
