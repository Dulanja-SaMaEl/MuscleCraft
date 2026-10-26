'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/auth-context';
import {
  Users,
  Calendar,
  Utensils,
  Video,
  Upload,
  Plus,
  CheckCircle2,
  ExternalLink,
  Edit,
  TrendingDown,
  Search,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { User, BodyMeasurement, Appointment, ExerciseVideo } from '@/lib/types';

export default function InstructorWorkspace() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'diet_builder' | 'video_upload'>('roster');

  const [clients, setClients] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [clientMeasurements, setClientMeasurements] = useState<BodyMeasurement[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Feedback note form
  const [feedbackMeasId, setFeedbackMeasId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Video Upload Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState<'Warmup' | 'Hypertrophy' | 'Powerlifting' | 'Mobility' | 'Coaching Clinic'>('Coaching Clinic');
  const [videoAccess, setVideoAccess] = useState<'common' | 'coaching_90'>('coaching_90');
  const [videoDuration, setVideoDuration] = useState('22:15');
  const [cfStreamId, setCfStreamId] = useState('cf_stream_masterclass_04');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoThumb, setVideoThumb] = useState('https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Diet Plan Builder State
  const [dietClientTarget, setDietClientTarget] = useState('usr_client_90');
  const [dietTitle, setDietTitle] = useState('90-Day Athletic Recomposition & Strength Phase III');
  const [dietPhase, setDietPhase] = useState('Phase 3: Hypertrophy Peak & Strength Convergence');
  const [dietCalories, setDietCalories] = useState(2750);
  const [dietProtein, setDietProtein] = useState(205);
  const [dietCarbs, setDietCarbs] = useState(300);
  const [dietFats, setDietFats] = useState(65);
  const [dietWater, setDietWater] = useState(4.5);
  const [dietSaved, setDietSaved] = useState(false);

  useEffect(() => {
    loadInstructorData();
  }, [currentUser]);

  const loadInstructorData = async () => {
    try {
      // Load all members to find assigned clients
      const res = await fetch('/api/admin/members?adminId=usr_admin_1');
      if (res.ok) {
        const d = await res.json();
        const assigned = (d.members || []).filter(
          (m: User) => m.role === 'client' && m.assignedInstructorId === (currentUser?.id || 'usr_inst_1')
        );
        // If none assigned in mock, show 90-day clients
        const clientList = assigned.length > 0 ? assigned : (d.members || []).filter((m: User) => m.tier === 'coaching_90');
        setClients(clientList);
        if (clientList.length > 0 && !selectedClient) {
          setSelectedClient(clientList[0]);
          loadMeasurementsForClient(clientList[0].id);
        }
      }

      // Load appointments
      const aptRes = await fetch(`/api/appointments?userId=${currentUser?.id || 'usr_inst_1'}`);
      if (aptRes.ok) {
        const d = await aptRes.json();
        setAppointments(d.appointments || []);
      }
    } catch (err) {
      console.error('Error loading instructor data:', err);
    }
  };

  const loadMeasurementsForClient = async (clientId: string) => {
    try {
      const res = await fetch(`/api/measurements?userId=${currentUser?.id || 'usr_inst_1'}&clientId=${clientId}`);
      if (res.ok) {
        const d = await res.json();
        setClientMeasurements(d.measurements || []);
      }
    } catch (err) {
      console.error('Error fetching client measurements:', err);
    }
  };

  const handleSelectClient = (client: User) => {
    setSelectedClient(client);
    loadMeasurementsForClient(client.id);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/videos?userId=${currentUser?.id || 'usr_inst_1'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle,
          category: videoCategory,
          duration: videoDuration,
          accessLevel: videoAccess,
          cfStreamId,
          thumbnailUrl: videoThumb,
          description: videoDesc,
        }),
      });

      if (res.ok) {
        setUploadSuccess(true);
        setVideoTitle('');
        setVideoDesc('');
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to upload video:', err);
    }
  };

  const handleSaveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/diet-plans?userId=${currentUser?.id || 'usr_inst_1'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dietClientTarget,
          title: dietTitle,
          phase: dietPhase,
          dailyCalories: Number(dietCalories),
          proteinG: Number(dietProtein),
          carbsG: Number(dietCarbs),
          fatsG: Number(dietFats),
          waterLiters: Number(dietWater),
          guidelines: [
            'Increase protein intake around high volume squat and deadlift days.',
            'Maintain continuous electrolyte balance with sea salt in pre-workout water.',
            'Prioritize 8 hours deep sleep for central nervous system restoration.',
          ],
          meals: [
            {
              meal: 'Meal 1 (Post-Rise)',
              items: '5 Whole Eggs, 100g Rolled Oats, 1 Scoop Whey',
              macros: '720 kcal | 58g P | 75g C | 22g F',
            },
            {
              meal: 'Meal 2 (Pre-Training)',
              items: '220g Lean Sirloin, 250g Jasmine Rice, Steamed Greens',
              macros: '780 kcal | 62g P | 82g C | 18g F',
            },
            {
              meal: 'Meal 3 (Post-Workout Refuel)',
              items: '2 Scoops Whey Isolate, 80g Maltodextrin / Rice Flour',
              macros: '480 kcal | 50g P | 80g C | 2g F',
            },
            {
              meal: 'Meal 4 (Evening Recomp)',
              items: '250g Atlantic Salmon, 250g Sweet Potatoes, Olive Oil',
              macros: '770 kcal | 52g P | 62g C | 30g F',
            },
          ],
        }),
      });

      if (res.ok) {
        setDietSaved(true);
        setTimeout(() => setDietSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save diet plan:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080809]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 w-full">
        {/* Instructor Header */}
        <div className="bg-[#121215] border border-blue-800/40 p-6 sm:p-8 rounded-lg mb-8 shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150'}
              alt={currentUser?.name || 'Elena Rostova'}
              className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1
                  style={{
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                  className="text-[24px] sm:text-[28px] text-white tracking-tight"
                >
                  {currentUser?.name || 'Elena Rostova'}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-blue-900/40 text-blue-300 border-blue-700/60">
                  Head Strength Coach
                </span>
                <span className="text-[10px] bg-green-950/80 text-green-400 border border-green-700/60 px-2 py-0.5 rounded font-bold uppercase">
                  Staff Verified
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                <span>Roster Capacity: <strong>12 Active VIP Athletes</strong></span>
                <span>•</span>
                <span>Active 90-Day Clients: <strong>{clients.length}</strong></span>
                <span>•</span>
                <span>Upcoming Appointments: <strong>{appointments.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded border border-rose-500/30 hover:border-rose-500/60 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 font-semibold text-[13px] sm:text-[14px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Log out of Coach Portal"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] mb-8 overflow-x-auto">
          {[
            { id: 'roster', label: `Assigned Clients & Form Review (${clients.length})` },
            { id: 'schedule', label: `Appointments & Masterminds (${appointments.length})` },
            { id: 'diet_builder', label: 'Diet Protocol Builder' },
            { id: 'video_upload', label: 'Upload Masterclass Video' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/[0.04]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ROSTER & MEASUREMENT REVIEWS */}
        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Client List */}
            <div className="lg:col-span-4 bg-[#121215] border border-white/[0.08] rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Assigned 90-Day Athletes
              </h3>

              <div className="space-y-2">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedClient?.id === c.id
                        ? 'bg-blue-950/40 border-blue-500'
                        : 'bg-[#18181d] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{c.name}</span>
                      <span className="text-[10px] font-bold text-gold uppercase bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20">
                        {c.tier === 'coaching_90' ? '90-Day VIP' : 'Monthly'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">{c.email}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Client Measurement Details */}
            <div className="lg:col-span-8 bg-[#121215] border border-white/[0.08] rounded-lg p-6 space-y-6">
              {selectedClient ? (
                <>
                  <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Inspecting Athlete Progress
                      </span>
                      <h2 className="text-xl font-bold text-white uppercase tracking-tight mt-1">
                        {selectedClient.name}
                      </h2>
                    </div>
                    <span className="text-xs text-green-400 font-semibold bg-green-950/60 px-2.5 py-1 rounded border border-green-700/40">
                      Phase 2 Active
                    </span>
                  </div>

                  {/* Client Measurements Table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Weekly Measurement Logs
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#18181d] text-gray-400 uppercase tracking-wider border-b border-white/[0.06]">
                          <tr>
                            <th className="py-2.5 px-3">Week</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Weight</th>
                            <th className="py-2.5 px-3">Body Fat</th>
                            <th className="py-2.5 px-3">Waist</th>
                            <th className="py-2.5 px-3">Arms</th>
                            <th className="py-2.5 px-3">Coach Feedback Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {clientMeasurements.map((m) => (
                            <tr key={m.id}>
                              <td className="py-3 px-3 font-bold text-gold">Wk {m.weekNumber}</td>
                              <td className="py-3 px-3 text-gray-300 font-mono">{m.date}</td>
                              <td className="py-3 px-3 font-bold text-white font-mono">{m.weightKg} kg</td>
                              <td className="py-3 px-3 text-gray-300 font-mono">{m.bodyFatPercentage || '—'}%</td>
                              <td className="py-3 px-3 text-gray-300 font-mono">{m.waistCm || '—'} cm</td>
                              <td className="py-3 px-3 text-gray-300 font-mono">{m.armsCm || '—'} cm</td>
                              <td className="py-3 px-3">
                                {m.coachFeedback ? (
                                  <span className="text-gray-300 italic">"{m.coachFeedback}"</span>
                                ) : (
                                  <span className="text-amber-400 text-[10px] font-semibold">Needs Feedback</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Select a client on the left to inspect measurement trajectory and leave coach notes.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE APPOINTMENTS & MASTERMINDS */}
        {activeTab === 'schedule' && (
          <div className="bg-[#121215] border border-white/[0.08] p-6 rounded-lg space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Upcoming Consultations & Masterminds
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your live 1-on-1 calls and cohort group masterminds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-[#18181d] border border-white/[0.06] p-5 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          apt.type === 'individual_consultation'
                            ? 'bg-gold/15 text-gold border-gold/40'
                            : 'bg-blue-900/40 text-blue-300 border-blue-700/50'
                        }`}
                      >
                        {apt.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{apt.title}</h4>
                    </div>
                    <span className="text-[10px] bg-green-950 text-green-400 px-2 py-0.5 rounded font-bold uppercase border border-green-700/40">
                      {apt.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    {apt.clientName && (
                      <div>
                        Client: <strong className="text-white">{apt.clientName}</strong>
                      </div>
                    )}
                    <div>
                      Date: <strong className="text-white font-mono">{new Date(apt.scheduledAt).toLocaleString()}</strong>
                    </div>
                  </div>

                  <a
                    href={apt.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-900/40 text-blue-300 border border-blue-600/50 hover:bg-blue-800 px-3 py-1.5 rounded transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" /> Launch Google Meet Session
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIET PROTOCOL BUILDER */}
        {activeTab === 'diet_builder' && (
          <form
            onSubmit={handleSaveDiet}
            className="bg-[#121215] border border-white/[0.08] p-6 sm:p-8 rounded-lg space-y-6 max-w-3xl"
          >
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Assign / Update Personalized Nutrition Protocol
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Sets the target calories, macros, and scheduled meal items rendered inside the client’s portal.
              </p>
            </div>

            {dietSaved && (
              <div className="p-3 bg-green-950/80 border border-green-700 text-green-300 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Diet protocol successfully saved and synchronized with client portal!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Target Athlete
                </label>
                <select
                  value={dietClientTarget}
                  onChange={(e) => setDietClientTarget(e.target.value)}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Protocol Title
                </label>
                <input
                  type="text"
                  required
                  value={dietTitle}
                  onChange={(e) => setDietTitle(e.target.value)}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  value={dietCalories}
                  onChange={(e) => setDietCalories(Number(e.target.value))}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3 py-2 rounded text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gold uppercase mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={dietProtein}
                  onChange={(e) => setDietProtein(Number(e.target.value))}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3 py-2 rounded text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-blue-400 uppercase mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={dietCarbs}
                  onChange={(e) => setDietCarbs(Number(e.target.value))}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3 py-2 rounded text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-amber-400 uppercase mb-1">
                  Fats (g)
                </label>
                <input
                  type="number"
                  value={dietFats}
                  onChange={(e) => setDietFats(Number(e.target.value))}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3 py-2 rounded text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-cyan-400 uppercase mb-1">
                  Water (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dietWater}
                  onChange={(e) => setDietWater(Number(e.target.value))}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3 py-2 rounded text-sm text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wide rounded transition-colors shadow-sm"
            >
              Save & Synchronize Diet Protocol
            </button>
          </form>
        )}

        {/* TAB 4: UPLOAD MASTERCLASS VIDEO */}
        {activeTab === 'video_upload' && (
          <form
            onSubmit={handleSaveVideo}
            className="bg-[#121215] border border-white/[0.08] p-6 sm:p-8 rounded-lg space-y-6 max-w-3xl"
          >
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Upload New Masterclass or Technique Video
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Cloudflare Stream metadata integration with instant transcoding and access level controls.
              </p>
            </div>

            {uploadSuccess && (
              <div className="p-3 bg-green-950/80 border border-green-700 text-green-300 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Video successfully uploaded and published to vault!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Squat Walkout & Bracing Fundamentals"
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value as any)}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none"
                >
                  <option value="Coaching Clinic">Coaching Clinic</option>
                  <option value="Powerlifting">Powerlifting</option>
                  <option value="Hypertrophy">Hypertrophy</option>
                  <option value="Warmup">Warmup</option>
                  <option value="Mobility">Mobility</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Access Level
                </label>
                <select
                  value={videoAccess}
                  onChange={(e) => setVideoAccess(e.target.value as any)}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none"
                >
                  <option value="coaching_90">90-Day VIP Exclusive</option>
                  <option value="common">Common (All Members)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  placeholder="e.g. 24:30"
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Cloudflare Stream ID
                </label>
                <input
                  type="text"
                  value={cfStreamId}
                  onChange={(e) => setCfStreamId(e.target.value)}
                  className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 px-3.5 py-2.5 rounded text-sm text-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Description & Coaching Notes
              </label>
              <textarea
                rows={3}
                required
                value={videoDesc}
                onChange={(e) => setVideoDesc(e.target.value)}
                placeholder="Key takeaways, time-codes, and cues to focus on."
                className="w-full bg-[#18181d] border border-white/[0.1] focus:border-blue-500 p-3.5 rounded text-sm text-white outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wide rounded transition-colors shadow-sm"
            >
              Publish Video to Vault
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
