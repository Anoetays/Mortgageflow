import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import applicationsRoutes from './routes/applications.js';
import documentsRoutes from './routes/documents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/documents', documentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MortgageFlow Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 MortgageFlow Backend running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});
