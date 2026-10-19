# MuscleCraft Platform — Production Deployment Guide

## Monorepo Architecture Overview
The repository is structured into two clean, independent folders:

```
MuscleCraft/
├── frontend/               # Next.js 14 App Router UI (Client/Admin Portals, 3D Scrollytelling)
│   ├── app/                # Pages and routes
│   ├── components/         # 3D Canvas, kinetic UI, and layouts
│   ├── public/             # Static assets, scrollytelling frames
│   ├── package.json        # Frontend dependencies
│   └── vercel.json         # Vercel configuration
│
├── backend/                # Node.js + Express REST API
│   ├── src/
│   │   ├── server.ts       # Express server entry point (CORS, health checks)
│   │   ├── routes/         # Auth, Payments, Admin, Measurements, Diet, Videos
│   │   ├── services/       # Business logic (AuthService, PaymentService, etc.)
│   │   └── db/             # In-memory mock database & persistence
│   ├── package.json        # Backend dependencies
│   └── render.yaml         # Render deployment blueprint
│
├── render.yaml             # Multi-service Render blueprint
├── vercel.json             # Root Vercel config
└── package.json            # Root workspaces manager
```

---

## 1. Hosting the Frontend on Vercel

1. In [Vercel](https://vercel.com), click **"Add New..." > "Project"**.
2. Import **`Dulanja-SaMaEl/MuscleCraft`**.
3. In the project setup:
   * **Root Directory**: Click "Edit" and choose **`frontend`** (or leave default root).
   * **Framework Preset**: `Next.js`
   * **Build Command**: `next build`
   * **Install Command**: `npm install`
4. *(Optional)* In Environment Variables, set:
   * `NEXT_PUBLIC_API_URL` = Your live Render backend URL (e.g. `https://musclecraft-backend-api.onrender.com`)
5. Click **Deploy**.

---

## 2. Hosting the Backend on Render

### Method A: 1-Click Multi-Service Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **"New +" > "Blueprint"**.
3. Connect **`Dulanja-SaMaEl/MuscleCraft`**.
4. Render will read the root [`render.yaml`](./render.yaml), which automatically provisions:
   - **`musclecraft-backend-api`** (Node.js Express API listening on `$PORT`)
   - **`musclecraft-frontend-web`** (Next.js frontend connected to the backend)
5. Click **Apply**.

### Method B: Standalone Web Service on Render
If you only want to host the backend API on Render (while hosting the frontend on Vercel):
1. In Render Dashboard, click **"New +" > "Web Service"**.
2. Connect **`Dulanja-SaMaEl/MuscleCraft`**.
3. Configure:
   * **Name**: `musclecraft-backend-api`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Health Check Path**: `/health`
4. Click **Create Web Service**.

---

## 3. Local Development Commands (From Root)

```bash
# Run both frontend and backend
npm run dev

# Run only frontend (http://localhost:3000)
npm run dev:frontend

# Run only backend API (http://localhost:5000)
npm run dev:backend

# Build frontend
npm run build:frontend

# Build backend
npm run build:backend
```

---

## 4. API Endpoints Reference
* `GET /health` — Service health check & uptime
* `GET /api/auth/session` — Session & available personas
* `POST /api/auth/session` — Authenticate persona
* `GET /api/payments` — Retrieve user or admin payments
* `POST /api/payments` — Submit bank transfer
* `POST /api/payments/:id/approve` — Admin payment approval
* `POST /api/payments/:id/reject` — Admin payment rejection
* `GET /api/admin/stats` — Facility telemetry & KPI stats
* `GET /api/admin/members` — Member directory
* `GET /api/admin/audit-logs` — Security & action audit logs
* `GET /api/measurements` — Client body metrics
* `POST /api/measurements` — Record weekly measurements
* `GET /api/diet-plans` — Client nutrition protocol
* `GET /api/appointments` — 1-on-1 coaching consultations
* `GET /api/videos` — Common and VIP video vault
