import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getIPOs, addIPO, clearAll, isFallbackMode } from './config/db.js';
import { seedKFintechIPOs } from './config/seed.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Server Init
const startServer = async () => {
  await connectDB();
  await seedKFintechIPOs(getIPOs, addIPO, clearAll);

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💾 Database Fallback Mode: ${isFallbackMode() ? 'ON (JSON DB)' : 'OFF (MDB Connect)'}`);
    console.log(`======================================================\n`);
  });
};

startServer();
