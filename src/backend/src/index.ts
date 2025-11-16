/**
 * Kiro SAP Resurrector - Backend API
 * Powered by Claude AI via Anthropic SDK
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { transformationRouter } from './routes/transformation';
import { analyzeRouter } from './routes/analyze';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Kiro SAP Resurrector',
    kiro: 'The Hero of Legacy Modernization',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/transform', transformationRouter);
app.use('/api/analyze', analyzeRouter);

// Start server
app.listen(PORT, () => {
  console.log('🚀 Kiro SAP Resurrector API started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('🦸 Kiro is ready to resurrect legacy SAP code!');
});

export default app;
