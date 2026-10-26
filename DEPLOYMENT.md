# MuscleCraft Platform — Production Deployment Guide
## Connecting Vercel (Frontend) with Render (Backend)

This repository is organized as a clean monorepo:
* **Frontend (`/frontend`)**: Next.js 14 App Router UI (Client/Admin Portals, 3D Scrollytelling, Canvas) -> Hosted on **Vercel**.
* **Backend (`/backend`)**: Node.js Express REST API (Auth, Payments, Admin, Measurements, Videos) -> Hosted on **Render**.

```
                   ┌──────────────────────────────────────┐
                   │        Vercel (Next.js 14)           │
                   │    https://musclecraft.vercel.app     │
                   └──────────────────┬───────────────────┘
                                      │
                   /api/* (Reverse Proxy via next.config.js)
                   Environment Variable: BACKEND_URL
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │         Render (Express API)         │
                   │  https://musclecraft-api.onrender.com │
                   └──────────────────────────────────────┘
```

---

## Step 1: Deploy the Backend on Render

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **"New +"** in the top right and select **"Web Service"**.
3. Connect your GitHub repository: **`Dulanja-SaMaEl/MuscleCraft`**.
4. Configure the Web Service with the following exact settings:
   * **Name**: `musclecraft-backend-api` (or any name you prefer)
   * **Region**: Choose the region closest to you (e.g. *Singapore* or *Oregon*)
   * **Branch**: `main`
   * **Root Directory**: `backend` *(Important!)*
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Plan**: `Free` or `Starter`
5. Expand **Advanced Settings**:
   * **Health Check Path**: `/health`
   * **Auto-Deploy**: `Yes`
6. Click **"Create Web Service"**.
7. Once Render finishes deploying, copy your live backend URL from the top of the Render dashboard:
   > Example: `https://musclecraft-backend-api.onrender.com`

---

## Step 2: Deploy the Frontend on Vercel & Connect to Render

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository: **`Dulanja-SaMaEl/MuscleCraft`**.
4. In the Project Setup:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click "Edit" and choose **`frontend`** *(Important!)*
   * **Build Command**: `next build` (Default)
   * **Output Directory**: `.next` (Default)
   * **Install Command**: `npm install` (Default)
5. Under **Environment Variables**, add the connection variable:
   * **Key**: `BACKEND_URL`
   * **Value**: Your Render URL from Step 1 (e.g. `https://musclecraft-backend-api.onrender.com`)
   *(Note: Do not include a trailing slash at the end of the URL)*
   * Also add:
     * **Key**: `NEXT_PUBLIC_API_URL`
     * **Value**: `https://musclecraft-backend-api.onrender.com`
6. Click **"Deploy"**.

---

## Step 3: How the Connection Works Behind the Scenes

The Next.js configuration in [`frontend/next.config.js`](./frontend/next.config.js) includes an automated reverse proxy:

```js
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (backendUrl) {
    const cleanUrl = backendUrl.replace(/\/$/, '');
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${cleanUrl}/api/:path*`,
        },
      ],
    };
  }
  return [];
}
```

### Why this is the best setup:
1. **Zero CORS Issues**: The browser only sends requests to your Vercel domain (`https://your-domain.vercel.app/api/...`), and Next.js securely proxies them to your Render backend on the server side.
2. **Automatic Fallback**: If `BACKEND_URL` is not set (e.g. in local development), the frontend seamlessly uses the built-in Next.js route handlers.
3. **Zero Code Changes**: All existing frontend calls (`fetch('/api/payments')`, `fetch('/api/admin/stats')`, etc.) work instantly without modifying code.

---

## Step 4: Verification Checklist

1. **Verify Backend (Render)**:
   Visit `https://your-backend.onrender.com/health` in your browser. You should see:
   ```json
   {
     "status": "healthy",
     "service": "MuscleCraft Backend API",
     "timestamp": "2026-10-27T...",
     "uptimeSeconds": 42
   }
   ```
2. **Verify Frontend (Vercel)**:
   Visit your Vercel URL (e.g. `https://musclecraft.vercel.app/admin`).
   Open Developer Tools (`F12` -> Network tab) and verify requests to `/api/admin/stats` return `200 OK` from the Render service.
