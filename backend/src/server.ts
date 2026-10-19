import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import measurementRoutes from './routes/measurements';
import dietRoutes from './routes/diet';
import appointmentRoutes from './routes/appointments';
import videoRoutes from './routes/videos';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })
);
app.use(express.json());

// Health Check & Root Info (Used by Render Health Check)
app.get(['/', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'MuscleCraft / IronForge Backend API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    endpoints: [
      '/api/auth/session',
      '/api/payments',
      '/api/admin/stats',
      '/api/admin/members',
      '/api/admin/audit-logs',
      '/api/measurements',
      '/api/diet-plans',
      '/api/appointments',
      '/api/videos',
    ],
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/diet-plans', dietRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/videos', videoRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`[MuscleCraft Backend] Server active and listening on port ${PORT}`);
});

export default app;
