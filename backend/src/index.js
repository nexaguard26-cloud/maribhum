import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

// Import routes
import authRoutes from './routes/auth.js';
import organizationsRoutes from './routes/organizations.js';
import tasksRoutes from './routes/tasks.js';
import volunteersRoutes from './routes/volunteers.js';
import reportsRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationsRoutes from './routes/notifications.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Marib Humanitarian API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🏠 Marib Humanitarian Management System API     ║
  ║                                                   ║
  ║   🚀 Server running on port ${PORT}                 ║
  ║   📍 http://localhost:${PORT}                      ║
  ║   🌐 Environment: ${config.nodeEnv.padEnd(15)}      ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
