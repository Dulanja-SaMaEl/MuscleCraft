# IronForge Athletic Club — Production Deployment & Architecture Guide

## Overview
This platform is architected as an elite, high-performance web application designed for deployment across **Vercel** (Next.js frontend), **Render** (Node.js API services), **Supabase** (PostgreSQL Database & Auth), and **Cloudflare Stream** (Adaptive Bitrate Video Infrastructure).

---

## 1. System Architecture

```mermaid
flowchart TD
    Client["Next.js 14+ App Router Client\n(Vercel Edge Network)"] --> API["Next.js API Routes / Express API\n(Render / Serverless)"]
    API --> Layer["Layered Domain Services\n(Auth, Payments, Coaching, Video, Admin)"]
    Layer --> DB[("Supabase PostgreSQL\n(Row-Level Security & Indexes)")]
    Layer --> CF["Cloudflare Stream\n(HLS / DASH Adaptive Streaming)"]
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` and populate the production credentials:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL="https://ironforge-athletics.com"
PORT=3000

# Supabase PostgreSQL & Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Cloudflare Stream Video Integration
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_STREAM_API_TOKEN="your_cloudflare_stream_api_token"
NEXT_PUBLIC_CLOUDFLARE_STREAM_DOMAIN="https://customer-xyz.cloudflarestream.com"
```

---

## 3. Database Deployment (Supabase PostgreSQL)

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the complete DDL migration script located at:
   ```
   supabase/schema.sql
   ```
3. This creates:
   - Enums: `user_role`, `membership_tier`, `user_status`, `payment_status`, `appointment_type`, `video_access_level`.
   - Tables: `profiles`, `payments`, `body_measurements`, `diet_plans`, `appointments`, `exercise_videos`, `audit_logs`.
   - Composite B-Tree and covering indexes on critical query paths.
   - Row Level Security (RLS) policies ensuring complete IDOR protection.

---

## 4. Vercel Frontend Deployment

1. Push this repository to GitHub or GitLab.
2. Link the repository in **Vercel**.
3. Configure the build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add all environment variables from Section 2 in the Vercel Project Settings.
5. Deploy.

---

## 5. Render Node.js API Deployment (Optional Standalone Service)

1. In the **Render Dashboard**, select **New Web Service**.
2. Connect the repository.
3. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables including `DATABASE_URL`.

---

## 6. Cloudflare Stream Video Uploading & Playback

1. In Cloudflare Dashboard, go to **Stream**.
2. Create an API Token with **Stream: Edit** permissions.
3. Videos uploaded via the `/instructor` workspace save the Cloudflare video ID into `exercise_videos.cf_stream_id`.
4. The client portal automatically loads the player for authorized tiers (Common vs 90-Day VIP).

---

## 7. Running Tests & Quality Verification

Run the automated test suite locally:
```bash
npm test
```

Expected verification:
```
✓ PASS: PaymentService generates unique reference format TRF-IRON-XXXXXX
✓ PASS: Client can submit manual bank transfer with pending status
✓ PASS: Admin can approve pending bank transfer and activate membership
✓ PASS: Client cannot approve payment (RBAC Security Enforcement)
✓ PASS: Client cannot view another client measurements (IDOR Prevention)
✓ PASS: Assigned Coach can view assigned client measurements
✓ PASS: Monthly gym client only receives common videos (Tier Enforcement)
✓ PASS: 90-Day VIP client receives all videos including exclusive clinics
✓ PASS: Security and payment events are recorded in audit logs
```
