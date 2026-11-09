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

-- 3. PROFILES TABLE (Supports both Supabase Auth UUIDs and Text IDs)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    assigned_instructor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    reviewed_by TEXT REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, reference_code);

-- 6. BODY MEASUREMENTS TABLE (Weekly Client Metrics)
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by TEXT REFERENCES public.profiles(id),
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

-- 8. EXERCISE & SESSION VIDEOS TABLE (Common or VIP Specific)
CREATE TABLE IF NOT EXISTS public.exercise_videos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
    access_level video_access_level DEFAULT 'common'::video_access_level NOT NULL,
    target_client_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_client_name TEXT,
    cf_stream_id TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    description TEXT NOT NULL,
    instructor_id TEXT REFERENCES public.profiles(id),
    instructor_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_videos_access ON public.exercise_videos(access_level, target_client_id);

-- 9. APPOINTMENTS TABLE (Consultations & Coaching Calls)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    instructor_id TEXT REFERENCES public.profiles(id),
    client_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'clients_only', 'coaching_90', 'members_only')),
    sender_id TEXT REFERENCES public.profiles(id),
    sender_name TEXT NOT NULL,
    channels JSONB DEFAULT '["in_app"]'::jsonb NOT NULL,
    sent_count INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'sent' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcast_date ON public.broadcast_messages(created_at DESC);

-- 11. DAILY SALES REVIEWS TABLE (MuscleCraft Marketing & Sales Spreadsheet)
CREATE TABLE IF NOT EXISTS public.daily_sales_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_id TEXT REFERENCES public.profiles(id),
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
-- ROW LEVEL SECURITY (RLS) POLICIES (Enabling Safe Access for App & Public)
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

-- Idempotent RLS: drop then recreate
DROP POLICY IF EXISTS "Allow read access to profiles" ON public.profiles;
CREATE POLICY "Allow read access to profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow write access to profiles" ON public.profiles;
CREATE POLICY "Allow write access to profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to packages" ON public.gym_packages;
CREATE POLICY "Allow read access to packages" ON public.gym_packages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow write access to packages" ON public.gym_packages;
CREATE POLICY "Allow write access to packages" ON public.gym_packages FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to payments" ON public.payments;
CREATE POLICY "Allow access to payments" ON public.payments FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to measurements" ON public.body_measurements;
CREATE POLICY "Allow access to measurements" ON public.body_measurements FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to diet plans" ON public.diet_plans;
CREATE POLICY "Allow access to diet plans" ON public.diet_plans FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to videos" ON public.exercise_videos;
CREATE POLICY "Allow access to videos" ON public.exercise_videos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to appointments" ON public.appointments;
CREATE POLICY "Allow access to appointments" ON public.appointments FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to broadcast" ON public.broadcast_messages;
CREATE POLICY "Allow access to broadcast" ON public.broadcast_messages FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to daily sales" ON public.daily_sales_reviews;
CREATE POLICY "Allow access to daily sales" ON public.daily_sales_reviews FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to crm settings" ON public.crm_marketing_settings;
CREATE POLICY "Allow access to crm settings" ON public.crm_marketing_settings FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow access to audit logs" ON public.audit_logs;
CREATE POLICY "Allow access to audit logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true);

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
    ('sole_1m', '1 Month Membership (Sole)', 'sole', '1m', 4500.00, 500.00, 'Single athlete 30-day all-access membership.', '["Unlimited gym floor & strength access", "Free weights & cardio zones", "Sauna & shower amenities", "Personal locker access"]'::jsonb, false, true),
    ('sole_3m', '3 Months Membership (Sole)', 'sole', '3m', 12000.00, 500.00, 'Quarterly training access for committed lifters.', '["Full strength & cardio floor access", "1 Coach fitness evaluation", "Quarterly progress review"]'::jsonb, false, true),
    ('sole_6m', '6 Months Membership (Sole)', 'sole', '6m', 22000.00, 500.00, 'Semi-annual membership with structured progression.', '["Full gym & amenities access", "2 Body composition scans", "Custom warm-up protocol"]'::jsonb, true, true),
    ('sole_1y', '1 Year Membership (Sole)', 'sole', '1y', 40000.00, 500.00, 'Our best-value annual individual package.', '["365 days VIP gym access", "Free guest pass monthly", "10% discount on supplements & gear", "Priority trainer bookings"]'::jsonb, false, true),
    ('couple_adm', 'Admission Fee (Couple)', 'couple', 'admission', 1000.00, 1000.00, 'One-time registration fee for couple / training partners.', '["Dual onboarding orientation", "Two access keycards", "Joint locker privilege"]'::jsonb, false, true),
    ('couple_1m', '1 Month Membership (Couple)', 'couple', '1m', 8000.00, 1000.00, 'Shared 30-day fitness access for partners.', '["Dual gym floor access", "Shared cardio & lifting zones", "Locker & shower facilities"]'::jsonb, false, true),
    ('couple_3m', '3 Months Membership (Couple)', 'couple', '3m', 22500.00, 1000.00, 'Quarterly dual pass for committed workout partners.', '["Full dual floor privileges", "Partner workout session blueprint", "Quarterly progress check-in"]'::jsonb, false, true),
    ('couple_6m', '6 Months Membership (Couple)', 'couple', '6m', 42000.00, 1000.00, 'Semi-annual partner training program.', '["Dual gym access for 6 months", "2 Partner body composition scans", "Dedicated locker"]'::jsonb, true, true),
    ('couple_1y', '1 Year Membership (Couple)', 'couple', '1y', 78000.00, 1000.00, 'Year-round elite partner pass.', '["365-day access for both athletes", "Monthly guest passes", "15% off gear & nutrition", "Joint coaching session"]'::jsonb, false, true),
    ('burnzone', 'MuscleCraft BurnZone', 'coaching', 'coaching', 3000.00, 500.00, 'High-intensity functional conditioning & CrossFit circuits.', '["CrossFit metabolic conditioning", "Agility, core & endurance", "Small-group atmosphere"]'::jsonb, false, true),
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

-- 3. Insert Personas / User Profiles
INSERT INTO public.profiles (id, email, name, phone, role, tier, package_id, package_name, package_type, status, avatar_url, joined_at)
VALUES
    ('usr_admin_1', 'adeesha@musclecraft.lk', 'Adeesha Kumarasingha (Owner & Head Coach)', '+94 77 123 4567', 'admin', 'sole_1y', 'sole_1y', '1 Year Membership (Sole)', 'membership', 'active', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '365 days'),
    ('usr_inst_1', 'coach.kasun@musclecraft.lk', 'Kasun Perera (Senior Coach)', '+94 77 234 5678', 'instructor', 'sole_1y', 'sole_1y', '1 Year Membership (Sole)', 'membership', 'active', 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '180 days'),
    ('usr_client_90', 'marcus@musclecraft.lk', 'Marcus Vance (90-Day VIP)', '+94 71 889 1234', 'client', 'coaching_90', 'coaching_90', '90-Day Better Me Online Coaching', 'coaching', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days'),
    ('usr_client_sole', 'dinuka@gmail.com', 'Dinuka Jayasuriya', '+94 76 555 4321', 'client', 'sole_3m', 'sole_3m', '3 Months Membership (Sole)', 'membership', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '15 days'),
    ('usr_client_couple', 'saman.rashmi@gmail.com', 'Saman & Rashmi', '+94 70 888 9999', 'client', 'couple_6m', 'couple_6m', '6 Months Membership (Couple)', 'membership', 'active', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '45 days'),
    ('usr_client_pending', 'rohan.v@gmail.com', 'Rohan Vidyaratne', '+94 78 333 2211', 'client', 'sole_1m', 'sole_1m', '1 Month Membership (Sole)', 'membership', 'pending', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 4. Insert November 2026 Daily Sales Review Records (Matching Client Spreadsheet Images)
INSERT INTO public.daily_sales_reviews (date, target, actual, spend, message_count, order_count, roas, cpr, notes)
VALUES
    ('2026-11-01', 0.00, 0.00, 1986.11, 45, 0, 0.0, 44.14, 'Campaign launch Day 1'),
    ('2026-11-02', 0.00, 0.00, 1277.03, 30, 0, 0.0, 42.57, 'Meta Ads Instagram Feed'),
    ('2026-11-03', 0.00, 0.00, 781.12, 17, 0, 0.0, 45.95, 'Story video creatives'),
    ('2026-11-04', 0.00, 0.00, 700.11, 24, 0, 0.0, 29.17, 'WhatsApp click-to-chat'),
    ('2026-11-05', 0.00, 0.00, 777.44, 19, 0, 0.0, 40.92, '90-Day VIP intake ads'),
    ('2026-11-06', 0.00, 0.00, 699.26, 23, 0, 0.0, 30.40, 'Strength & Hypertrophy promo')
ON CONFLICT (date) DO UPDATE SET
    spend = EXCLUDED.spend,
    message_count = EXCLUDED.message_count,
    cpr = EXCLUDED.cpr,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- 5. Insert Verified & Pending Payments
INSERT INTO public.payments (id, user_id, reference_code, package_id, tier, amount, currency, bank_name, transfer_date, sender_account_name, status, admin_notes)
VALUES
    ('pay_001', 'usr_client_90', 'TRF-MC-908122', 'coaching_90', 'coaching_90', 8000.00, 'LKR', 'Commercial Bank of Ceylon', '2026-10-10', 'Marcus Vance', 'approved', 'Reconciled & activated 90-day cohort'),
    ('pay_002', 'usr_client_sole', 'TRF-MC-304192', 'sole_3m', 'sole_3m', 12500.00, 'LKR', 'Bank of Ceylon', '2026-10-25', 'Dinuka Jayasuriya', 'approved', 'Verified slip reference. Admitted with Rs. 500 admission fee.'),
    ('pay_003', 'usr_client_couple', 'TRF-MC-881204', 'couple_6m', 'couple_6m', 43000.00, 'LKR', 'Hatton National Bank', '2026-09-20', 'Saman Perera', 'approved', 'Couple 6M pass activated.'),
    ('pay_004', 'usr_client_pending', 'TRF-MC-541908', 'sole_1m', 'sole_1m', 5000.00, 'LKR', 'Sampath Bank PLC', '2026-11-08', 'Rohan Vidyaratne', 'pending', 'Awaiting slip receipt image check')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount;

-- 6. Insert Body Measurements for Marcus Vance (90-Day Cohort)
INSERT INTO public.body_measurements (id, user_id, week_number, date, weight_kg, body_fat_percentage, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, notes, coach_feedback, feedback_at)
VALUES
    ('meas_w1', 'usr_client_90', 1, '2026-10-12', 88.5, 23.2, 105.0, 94.0, 102.0, 37.0, 61.0, 'Baseline measurement after joining 90-day cohort.', 'Solid baseline Marcus. Focus on hitting the 205g daily protein target this week.', NOW() - INTERVAL '25 days'),
    ('meas_w2', 'usr_client_90', 2, '2026-10-19', 87.2, 22.4, 104.5, 92.5, 101.5, 37.2, 60.5, 'Felt good energy throughout sessions.', 'Great waist reduction of 1.5cm in one week! Keep water above 4 liters.', NOW() - INTERVAL '18 days'),
    ('meas_w3', 'usr_client_90', 3, '2026-10-26', 86.0, 21.6, 105.0, 91.0, 101.0, 37.5, 60.0, 'Workouts felt strong. Recovery is smooth.', 'Chest holding strong while waist continues tapering down. Fantastic progress.', NOW() - INTERVAL '11 days'),
    ('meas_w4', 'usr_client_90', 4, '2026-11-02', 85.1, 20.8, 105.5, 89.5, 100.5, 37.8, 59.8, 'Week 4 milestone completed.', 'Down 3.4kg total with arms up! Perfect body recomposition trajectory.', NOW() - INTERVAL '4 days')
ON CONFLICT (user_id, week_number) DO UPDATE SET
    weight_kg = EXCLUDED.weight_kg,
    body_fat_percentage = EXCLUDED.body_fat_percentage,
    coach_feedback = EXCLUDED.coach_feedback;

-- 7. Insert Diet Plan for Marcus Vance
INSERT INTO public.diet_plans (id, user_id, assigned_by, title, phase, daily_calories, protein_g, carbs_g, fats_g, water_liters, guidelines, meals)
VALUES
    ('diet_01', 'usr_client_90', 'usr_admin_1', '90-Day Athletic Recomposition & Hypertrophy Blueprint', 'Phase 2: Lean Recomposition & Strength Convergence', 2650, 205, 280, 65, 4.5,
    '["Maintain 4.5L pure water intake daily", "Take whey protein within 45 mins post-workout", "Creatine monohydrate 5g with breakfast", "Last solid carbohydrate meal 2.5 hours before sleep"]'::jsonb,
    '[{"mealNumber": 1, "title": "Breakfast Power Stack", "items": ["6 Whole Eggs + 2 Whites", "100g Rolled Oats with cinnamon", "1 Medium Banana", "Black Coffee / Green Tea"], "calories": 680, "protein": 48, "carbs": 72, "fats": 22}, {"mealNumber": 2, "title": "Mid-Day Anabolic Fuel", "items": ["220g Grilled Chicken Breast", "250g Steamed Basmati Rice", "Broccoli & Green Beans in olive oil"], "calories": 720, "protein": 62, "carbs": 80, "fats": 16}, {"mealNumber": 3, "title": "Pre-Workout Primer", "items": ["1 Scoop Whey Isolate", "2 Rice Cakes with natural peanut butter", "1 Apple"], "calories": 350, "protein": 30, "carbs": 42, "fats": 7}, {"mealNumber": 4, "title": "Post-Workout Recovery Dinner", "items": ["200g Lean Beef or White Fish", "300g Baked Sweet Potato", "Large Mixed Leaf Salad with balsamic"], "calories": 640, "protein": 52, "carbs": 75, "fats": 14}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    daily_calories = EXCLUDED.daily_calories,
    protein_g = EXCLUDED.protein_g,
    updated_at = NOW();

-- 8. Insert Exercise Videos (Common & VIP Exclusive)
INSERT INTO public.exercise_videos (id, title, category, duration, access_level, video_url, thumbnail_url, description, instructor_name)
VALUES
    ('vid_01', 'Barbell Back Squat — Biomechanics & Depth Mechanics', 'Powerlifting', '18:42', 'common', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop', 'Comprehensive foot stance, hip hinge, knee tracking, and bracing tutorial by Head Coach Adeesha.', 'Adeesha Kumarasingha'),
    ('vid_02', 'Overhead Press Shoulder Mobility & Scapular Rhythm', 'Mobility', '14:15', 'common', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop', 'Thoracic spine extension and shoulder external rotation drills to prevent impingement.', 'Adeesha Kumarasingha'),
    ('vid_03', '90-Day VIP Coaching: Masterclass on Macronutrient Timing', 'Coaching Clinic', '28:10', 'coaching_90', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop', 'Private VIP cohort clinical deep dive on carb backloading, glycemic control, and training energy optimization.', 'Adeesha Kumarasingha')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    access_level = EXCLUDED.access_level;

-- 9. Insert Broadcast Announcements
INSERT INTO public.broadcast_messages (id, title, body, target_audience, sender_name, channels, sent_count, status)
VALUES
    ('bc_01', 'New Eleiko Olympic Barbells Installed at MuscleCraft Floor', 'We have installed brand new Eleiko competition barbells and calibrated bumper plates on Platforms 1 & 2. Enjoy your personal record attempts!', 'all', 'Coach Adeesha', '["in_app", "push"]'::jsonb, 142, 'sent'),
    ('bc_02', 'Sunday 90-Day VIP Cohort WhatsApp Check-in Reminder', 'Gentle reminder to all 90-Day Better Me athletes: please log your Week 4 body weight and waist measurements by 8:00 PM Sunday for weekly review.', 'coaching_90', 'Coach Adeesha', '["in_app", "sms"]'::jsonb, 12, 'sent')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body;
