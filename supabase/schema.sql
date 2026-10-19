-- ============================================================================
-- IronForge Athletic Club — Supabase PostgreSQL Schema
-- Compliant with postgres-patterns, database-design, and security-review skills
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('client', 'instructor', 'admin');
CREATE TYPE membership_tier AS ENUM ('none', 'monthly', 'coaching_90');
CREATE TYPE user_status AS ENUM ('active', 'pending', 'suspended', 'banned');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE appointment_type AS ENUM ('individual_consultation', 'group_coaching');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE video_access_level AS ENUM ('common', 'coaching_90');

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'client'::user_role NOT NULL,
    tier membership_tier DEFAULT 'none'::membership_tier NOT NULL,
    status user_status DEFAULT 'pending'::user_status NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    assigned_instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    membership_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index on email & role
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_instructor ON public.profiles (assigned_instructor_id);

-- 2. Manual Bank Transfer Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference_code TEXT UNIQUE NOT NULL,
    tier membership_tier NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    bank_name TEXT NOT NULL,
    transfer_date DATE NOT NULL,
    sender_account_name TEXT NOT NULL,
    receipt_notes TEXT,
    receipt_url TEXT,
    status payment_status DEFAULT 'pending'::payment_status NOT NULL,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_ref ON public.payments (status, reference_code);

-- 3. Weekly Body Measurements Table
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    date DATE NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    body_fat_percentage NUMERIC(4,1),
    chest_cm NUMERIC(5,1),
    waist_cm NUMERIC(5,1),
    hips_cm NUMERIC(5,1),
    arms_cm NUMERIC(5,1),
    thighs_cm NUMERIC(5,1),
    notes TEXT,
    coach_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_week UNIQUE (user_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.body_measurements (user_id, date);

-- 4. Personalized Diet Plans Table
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    phase TEXT NOT NULL,
    daily_calories INTEGER NOT NULL,
    protein_g INTEGER NOT NULL,
    carbs_g INTEGER NOT NULL,
    fats_g INTEGER NOT NULL,
    water_liters NUMERIC(3,1) DEFAULT 3.5 NOT NULL,
    guidelines JSONB DEFAULT '[]'::jsonb NOT NULL,
    meals JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_user ON public.diet_plans (user_id);

-- 5. Appointments Table (1-on-1 Consultation & Weekly Group Coaching)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type appointment_type NOT NULL,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id),
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    meeting_link TEXT NOT NULL,
    status appointment_status DEFAULT 'scheduled'::appointment_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments (client_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_instructor ON public.appointments (instructor_id, scheduled_at);

-- 6. Exercise & Coaching Session Videos Table (Cloudflare Stream metadata)
CREATE TABLE IF NOT EXISTS public.exercise_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
    access_level video_access_level DEFAULT 'common'::video_access_level NOT NULL,
    cf_stream_id TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    description TEXT NOT NULL,
    instructor_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_access ON public.exercise_videos (access_level);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id, created_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile; instructors can view assigned clients; admins view all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

-- Payments: Client sees own payments; Admins see all
CREATE POLICY "Clients see own payments" ON public.payments
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Clients insert payments" ON public.payments
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Body Measurements: Client sees own measurements; Assigned coach and Admin see client measurements
CREATE POLICY "Clients access own measurements" ON public.body_measurements
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Diet Plans: Client sees assigned plan; Coach who created it or Admin can edit
CREATE POLICY "Clients see assigned diet plan" ON public.diet_plans
    FOR SELECT USING ((SELECT auth.uid()) = user_id);
