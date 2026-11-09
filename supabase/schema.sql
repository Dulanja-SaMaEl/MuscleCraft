-- ============================================================================
-- MuscleCraft Fitness Platform — Official Supabase PostgreSQL Schema
-- Production Database Setup with Schema, Security RLS, Triggers & Seed Data
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS (Safe idempotent creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'pending', 'suspended', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE video_access_level AS ENUM ('common', 'coaching_90', 'client_specific');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'client'::user_role NOT NULL,
    tier TEXT DEFAULT 'none',
    package_id TEXT,
    package_name TEXT,
    package_type TEXT,
    status user_status DEFAULT 'active'::user_status NOT NULL,
    avatar_url TEXT,
    assigned_instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_instructor_name TEXT,
    membership_expires_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_instructor ON public.profiles(assigned_instructor_id);

-- 4. GYM PACKAGES TABLE (Editable via Admin Panel)
CREATE TABLE IF NOT EXISTS public.gym_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('sole', 'couple', 'coaching')),
    duration_type TEXT NOT NULL CHECK (duration_type IN ('admission', '1m', '3m', '6m', '1y', 'coaching')),
    price NUMERIC(12,2) NOT NULL,
    admission_fee NUMERIC(12,2) DEFAULT 0 NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    popular BOOLEAN DEFAULT false NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gym_packages_cat ON public.gym_packages(category, active);

-- 5. PAYMENTS TABLE (Bank Transfers & Enrollments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reference_code TEXT UNIQUE NOT NULL,
    package_id TEXT REFERENCES public.gym_packages(id) ON DELETE SET NULL,
    tier TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'LKR' NOT NULL,
    bank_name TEXT NOT NULL,
    transfer_date DATE NOT NULL,
    sender_account_name TEXT NOT NULL,
    receipt_url TEXT,
    receipt_notes TEXT,
    status payment_status DEFAULT 'pending'::payment_status NOT NULL,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, reference_code);

-- 6. BODY MEASUREMENTS TABLE (Body Analytics Submissions)
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    feedback_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_week UNIQUE (user_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_measurements_user ON public.body_measurements(user_id, date);

-- 7. DIET PLANS TABLE
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
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

CREATE INDEX IF NOT EXISTS idx_diet_plans_user ON public.diet_plans(user_id);

-- 8. EXERCISE & SESSION VIDEOS TABLE (Common or Client-Specific)
CREATE TABLE IF NOT EXISTS public.exercise_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
    access_level video_access_level DEFAULT 'common'::video_access_level NOT NULL,
    target_client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_client_name TEXT,
    cf_stream_id TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    description TEXT NOT NULL,
    instructor_id UUID REFERENCES public.profiles(id),
    instructor_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_videos_access ON public.exercise_videos(access_level, target_client_id);

-- 9. APPOINTMENTS TABLE (Consultations & Coaching Calls)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    instructor_id UUID REFERENCES public.profiles(id),
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    meeting_link TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id, scheduled_at);

-- 10. BROADCAST MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'clients_only', 'coaching_90', 'members_only')),
    sender_id UUID REFERENCES public.profiles(id),
    sender_name TEXT NOT NULL,
    channels JSONB DEFAULT '["in_app"]'::jsonb NOT NULL,
    sent_count INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'sent' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcast_date ON public.broadcast_messages(created_at DESC);

-- 11. DAILY SALES REVIEWS TABLE (MuscleCraft Marketing & Sales Spreadsheet)
CREATE TABLE IF NOT EXISTS public.daily_sales_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    target NUMERIC(12,2) DEFAULT 0 NOT NULL,
    actual NUMERIC(12,2) DEFAULT 0 NOT NULL,
    diff NUMERIC(12,2) GENERATED ALWAYS AS (actual - target) STORED,
    spend NUMERIC(12,2) DEFAULT 0 NOT NULL,
    message_count INTEGER DEFAULT 0 NOT NULL,
    order_count INTEGER DEFAULT 0 NOT NULL,
    roas NUMERIC(8,2) DEFAULT 0 NOT NULL,
    cpr NUMERIC(8,2) DEFAULT 0 NOT NULL,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON public.daily_sales_reviews(date ASC);

-- 12. CRM MARKETING SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.crm_marketing_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    ad_account_lifetime_spend NUMERIC(14,2) DEFAULT 635555.20 NOT NULL,
    currency TEXT DEFAULT 'LKR' NOT NULL,
    target_cpr NUMERIC(8,2) DEFAULT 40.00 NOT NULL,
    target_roas NUMERIC(8,2) DEFAULT 4.50 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_packages_updated_at ON public.gym_packages;
CREATE TRIGGER set_packages_updated_at
BEFORE UPDATE ON public.gym_packages
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_diet_plans_updated_at ON public.diet_plans;
CREATE TRIGGER set_diet_plans_updated_at
BEFORE UPDATE ON public.diet_plans
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_daily_sales_updated_at ON public.daily_sales_reviews;
CREATE TRIGGER set_daily_sales_updated_at
BEFORE UPDATE ON public.daily_sales_reviews
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles can be viewed by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles can be viewed by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
CREATE POLICY "Admins full access to profiles" ON public.profiles
    FOR ALL TO authenticated USING (is_admin());

-- Gym Packages Policies
DROP POLICY IF EXISTS "Anyone can view active gym packages" ON public.gym_packages;
CREATE POLICY "Anyone can view active gym packages" ON public.gym_packages
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON public.gym_packages;
CREATE POLICY "Admins can manage packages" ON public.gym_packages
    FOR ALL TO authenticated USING (is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments;
CREATE POLICY "Clients can view own payments" ON public.payments
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Clients can create payments" ON public.payments;
CREATE POLICY "Clients can create payments" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" ON public.payments
    FOR UPDATE TO authenticated USING (is_admin());

-- Body Measurements Policies
DROP POLICY IF EXISTS "Clients can view own measurements or admin" ON public.body_measurements;
CREATE POLICY "Clients can view own measurements or admin" ON public.body_measurements
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Clients can insert own measurements" ON public.body_measurements;
CREATE POLICY "Clients can insert own measurements" ON public.body_measurements
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Admins can update measurements (coach feedback)" ON public.body_measurements;
CREATE POLICY "Admins can update measurements (coach feedback)" ON public.body_measurements
    FOR UPDATE TO authenticated USING (is_admin());

-- Exercise Videos Policies
DROP POLICY IF EXISTS "Members can view common videos" ON public.exercise_videos;
CREATE POLICY "Members can view common videos" ON public.exercise_videos
    FOR SELECT TO authenticated USING (
        access_level = 'common'
        OR target_client_id = auth.uid()
        OR is_admin()
    );

DROP POLICY IF EXISTS "Admins can manage videos" ON public.exercise_videos;
CREATE POLICY "Admins can manage videos" ON public.exercise_videos
    FOR ALL TO authenticated USING (is_admin());

-- Daily Sales Reviews Policies
DROP POLICY IF EXISTS "Admins have full access to daily sales" ON public.daily_sales_reviews;
CREATE POLICY "Admins have full access to daily sales" ON public.daily_sales_reviews
    FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins have full access to crm settings" ON public.crm_marketing_settings;
CREATE POLICY "Admins have full access to crm settings" ON public.crm_marketing_settings
    FOR ALL TO authenticated USING (is_admin());

-- Broadcast Messages Policies
DROP POLICY IF EXISTS "Users can read broadcast messages" ON public.broadcast_messages;
CREATE POLICY "Users can read broadcast messages" ON public.broadcast_messages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage broadcast messages" ON public.broadcast_messages;
CREATE POLICY "Admins can manage broadcast messages" ON public.broadcast_messages
    FOR ALL TO authenticated USING (is_admin());

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR ALL TO authenticated USING (is_admin());

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. Insert Default CRM Marketing Settings
INSERT INTO public.crm_marketing_settings (id, ad_account_lifetime_spend, currency, target_cpr, target_roas)
VALUES ('default', 635555.20, 'LKR', 40.00, 4.50)
ON CONFLICT (id) DO UPDATE SET
    ad_account_lifetime_spend = EXCLUDED.ad_account_lifetime_spend,
    updated_at = NOW();

-- 2. Insert Official Gym Packages
INSERT INTO public.gym_packages (id, name, category, duration_type, price, admission_fee, description, features, popular, active)
VALUES
    ('sole_adm', 'Admission Fee (Sole)', 'sole', 'admission', 500.00, 500.00, 'One-time registration fee for individual members.', '["Locker room access", "Fitness onboarding orientation", "Keycard access tag"]'::jsonb, false, true),
    ('sole_1m', '1 Month Membership (Sole)', 'sole', '1m', 45000.00, 500.00, 'Single athlete 30-day all-access membership.', '["Unlimited gym floor & strength access", "Free weights & cardio zones", "Sauna & shower amenities", "Personal locker access"]'::jsonb, false, true),
    ('sole_3m', '3 Months Membership (Sole)', 'sole', '3m', 12000.00, 500.00, 'Quarterly training access for committed lifters.', '["Full strength & cardio floor access", "1 Coach fitness evaluation", "Quarterly progress review"]'::jsonb, false, true),
    ('sole_6m', '6 Months Membership (Sole)', 'sole', '6m', 22000.00, 500.00, 'Semi-annual membership with structured progression.', '["Full gym & amenities access", "2 Body composition scans", "Custom warm-up protocol"]'::jsonb, true, true),
    ('sole_1y', '1 Year Membership (Sole)', 'sole', '1y', 40000.00, 500.00, 'Our best-value annual individual package.', '["365 days VIP gym access", "Free guest pass monthly", "10% discount on supplements & gear", "Priority trainer bookings"]'::jsonb, false, true),
    ('couple_adm', 'Admission Fee (Couple)', 'couple', 'admission', 1000.00, 1000.00, 'One-time registration fee for couple / training partners.', '["Dual onboarding orientation", "Two access keycards", "Joint locker privilege"]'::jsonb, false, true),
    ('couple_1m', '1 Month Membership (Couple)', 'couple', '1m', 8000.00, 1000.00, 'Shared 30-day fitness access for partners.', '["Dual gym floor access", "Shared cardio & lifting zones", "Locker & shower facilities"]'::jsonb, false, true),
    ('couple_3m', '3 Months Membership (Couple)', 'couple', '3m', 22500.00, 1000.00, 'Quarterly dual pass for committed workout partners.', '["Full dual floor privileges", "Partner workout session blueprint", "Quarterly progress check-in"]'::jsonb, false, true),
    ('couple_6m', '6 Months Membership (Couple)', 'couple', '6m', 42000.00, 1000.00, 'Semi-annual partner training program.', '["Dual gym access for 6 months", "2 Partner body composition scans", "Dedicated locker"]'::jsonb, true, true),
    ('couple_1y', '1 Year Membership (Couple)', 'couple', '1y', 78000.00, 1000.00, 'Year-round elite partner pass.', '["365-day access for both athletes", "Monthly guest passes", "15% off gear & nutrition", "Joint coaching session"]'::jsonb, false, true),
    ('coaching_starter', '1 Month Online Starter', 'coaching', 'coaching', 3000.00, 0.00, 'Foundational 30-day nutrition & workout blueprint.', '["Personalized macronutrient targets", "Home or gym lifting split", "Bi-weekly WhatsApp check-in"]'::jsonb, false, true),
    ('coaching_90', '90-Day Better Me Online Coaching', 'coaching', 'coaching', 8000.00, 0.00, 'Head Coach Adeesha''s signature 90-day transformation.', '["Phase-by-phase nutrition & workout regimen", "Weekly body metric & photo reviews", "Private 1-on-1 WhatsApp coaching desk", "Exclusive video analysis & form corrections", "Automated 90-day progress graduation"]'::jsonb, true, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    duration_type = EXCLUDED.duration_type,
    price = EXCLUDED.price,
    admission_fee = EXCLUDED.admission_fee,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    popular = EXCLUDED.popular,
    active = EXCLUDED.active,
    updated_at = NOW();

-- 3. Insert Admin Profiles (Coach Adeesha)
INSERT INTO public.profiles (id, email, name, phone, role, tier, package_id, package_name, package_type, status, avatar_url, joined_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'adeesha@musclecraft.lk', 'Adeesha Kumarasingha (Owner & Head Coach)', '+94 77 123 4567', 'admin', 'sole_1y', 'sole_1y', '1 Year Membership (Sole)', 'membership', 'active', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '365 days'),
    ('b0000000-0000-0000-0000-000000000001', 'marcus@musclecraft.lk', 'Marcus Vance', '+94 71 889 1234', 'client', 'coaching_90', 'coaching_90', '90-Day Better Me Online Coaching', 'coaching', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days')
ON CONFLICT (email) DO NOTHING;

-- 4. Insert November 2026 Daily Sales Review Records (Matching Client Spreadsheet Images)
INSERT INTO public.daily_sales_reviews (date, target, actual, spend, message_count, order_count, roas, cpr, notes)
VALUES
    ('2026-11-01', 0.00, 0.00, 1986.11, 45, 0, 0.0, 44.14, 'Lead gen campaign launch'),
    ('2026-11-02', 0.00, 0.00, 1277.03, 30, 0, 0.0, 42.57, 'Meta Ads Instagram Feed'),
    ('2026-11-03', 0.00, 0.00, 781.12, 17, 0, 0.0, 45.95, 'Story video creatives'),
    ('2026-11-04', 0.00, 0.00, 700.11, 24, 0, 0.0, 29.17, 'WhatsApp consultation push'),
    ('2026-11-05', 0.00, 0.00, 777.44, 19, 0, 0.0, 40.92, '90-Day transformation lead campaign'),
    ('2026-11-06', 0.00, 0.00, 699.26, 23, 0, 0.0, 30.40, 'Re-engagement retargeting ad')
ON CONFLICT (date) DO UPDATE SET
    spend = EXCLUDED.spend,
    message_count = EXCLUDED.message_count,
    cpr = EXCLUDED.cpr,
    updated_at = NOW();

-- Populate rest of November 2026 days with 0 for tracking
INSERT INTO public.daily_sales_reviews (date, target, actual, spend, message_count, order_count, roas, cpr)
SELECT
    d::date,
    0.00,
    0.00,
    0.00,
    0,
    0,
    0.0,
    0.0
FROM generate_series('2026-11-07'::date, '2026-11-30'::date, '1 day'::interval) AS d
ON CONFLICT (date) DO NOTHING;
