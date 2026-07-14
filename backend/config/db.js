import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IPO, History } from '../models/Schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_DIR = path.join(__dirname, '../data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'fallback_db.json');

let isFallback = false;

// Initialize JSON fallback database
const initFallbackDB = () => {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify({ ipos: [], history: [] }, null, 2));
  }
};

// Read fallback database JSON
const readFallbackDB = () => {
  initFallbackDB();
  try {
    const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON DB: ${error.message}`);
    return { ipos: [], history: [] };
  }
};

// Write fallback database JSON
const writeFallbackDB = (data) => {
  initFallbackDB();
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing JSON DB: ${error.message}`);
    return false;
  }
};

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ipo_allotment';
    // Use a small timeout so it fails quickly if local mongod is not running
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, 
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isFallback = false;
  } catch (error) {
    console.warn(`\n⚠️  MongoDB Connection Failed: ${error.message}`);
    console.warn(`💡 Falling back to local JSON database: ${FALLBACK_FILE}\n`);
    initFallbackDB();
    isFallback = true;
  }
};

export const isFallbackMode = () => isFallback;

export const getIPOs = async () => {
  if (!isFallback) {
    return await IPO.find({}).sort({ createdAt: -1 });
  } else {
    const db = readFallbackDB();
    // Sort by createdAt or fallback to reverse order
    return [...db.ipos].reverse();
  }
};

export const addIPO = async (ipoData) => {
  if (!isFallback) {
    const ipo = new IPO(ipoData);
    return await ipo.save();
  } else {
    const db = readFallbackDB();
    const newIpo = {
      _id: `ipo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...ipoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.ipos.push(newIpo);
    writeFallbackDB(db);
    return newIpo;
  }
};

export const getHistory = async () => {
  if (!isFallback) {
    return await History.find({}).sort({ timestamp: -1 }).limit(50);
  } else {
    const db = readFallbackDB();
    return [...db.history].reverse().slice(0, 50);
  }
};

export const addHistory = async (historyData) => {
  if (!isFallback) {
    const history = new History(historyData);
    return await history.save();
  } else {
    const db = readFallbackDB();
    const newHistory = {
      _id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...historyData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.history.push(newHistory);
    writeFallbackDB(db);
    return newHistory;
  }
};

export const clearAll = async () => {
  if (!isFallback) {
    await IPO.deleteMany({});
    await History.deleteMany({});
  } else {
    writeFallbackDB({ ipos: [], history: [] });
  }
};
