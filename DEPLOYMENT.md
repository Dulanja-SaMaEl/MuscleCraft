# IronForge Athletic Club — Production Deployment Guide

## Architecture Overview
This application is a **full-stack modern web platform** built with Next.js 14 (App Router). It contains **both the frontend and backend in a unified repository**:

* **Frontend**: Responsive React 18 UI, 3D Scrollytelling engine with GSAP, interactive DTLA map, client portal, instructor workspace, and admin dashboard.
* **Backend**: Server-side Next.js Route Handlers (`app/api/*`) handling authentication, role-based access control (RBAC), bank transfer payments, coaching telemetry, appointment scheduling, and audit logs.
* **Database**: Runs out-of-the-box with an in-memory mock database with persistent state, or seamlessly connects to **Supabase PostgreSQL** via environment variables.

---

## Option 1: Deploying to Vercel (Recommended for Best Global Edge Performance)

Vercel natively hosts both the frontend and backend API routes as serverless functions with zero configuration.

### Steps:
1. Go to [Vercel](https://vercel.com) and click **"Add New..." > "Project"**.
2. Connect your GitHub account and import **`Dulanja-SaMaEl/MuscleCraft`**.
3. Vercel automatically detects **Next.js**:
   * **Framework Preset**: Next.js
   * **Build Command**: `next build`
   * **Output Directory**: `.next`
   * **Install Command**: `npm install`
4. *(Optional)* Add environment variables from `.env.example` if connecting to Supabase:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `DATABASE_URL`
5. Click **Deploy**. Vercel will build both the frontend and backend API routes and provide you with a live URL (e.g., `https://musclecraft.vercel.app`).

---

## Option 2: Deploying to Render (Full-Stack Node.js Web Service)

Render runs the full application (frontend + backend APIs) as an active Node.js server.

### Method A: 1-Click Blueprint (Using `render.yaml`)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **"New +" > "Blueprint"**.
3. Select your repository: **`Dulanja-SaMaEl/MuscleCraft`**.
4. Render will read the included [`render.yaml`](./render.yaml) file and configure the service automatically.
5. Click **Apply**.

### Method B: Manual Web Service
1. In the Render Dashboard, click **"New +" > "Web Service"**.
2. Select your repository: **`Dulanja-SaMaEl/MuscleCraft`**.
3. Configure the settings:
   * **Name**: `musclecraft-app`
   * **Region**: Oregon (or nearest to your users)
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
   * **Plan**: Free or Starter
4. Render automatically supplies the `$PORT` environment variable, which `next start` binds to.
5. Click **Create Web Service**.

---

## Option 3: Two-Tier Setup (Frontend on Vercel + Backend on Render)

If you prefer to separate the traffic:
1. **Frontend on Vercel**: Deploy the repo to Vercel and point `NEXT_PUBLIC_API_URL` to your Render service.
2. **Backend on Render**: Deploy the repo to Render as a Web Service. The API routes in `/api/*` will serve as the dedicated backend.

---

## Verifying Deployment Health
After deploying to either Vercel or Render, test these endpoints:
* **Frontend Home**: `https://your-domain.com/` (Verify 3D hero and scroll animations)
* **Backend Auth API**: `https://your-domain.com/api/auth/session` (Returns 200 with available personas)
* **Backend Admin Stats API**: `https://your-domain.com/api/admin/stats` (Returns 200 with facility metrics)
* **Client Portal**: `https://your-domain.com/client`
* **Admin Dashboard**: `https://your-domain.com/admin`
