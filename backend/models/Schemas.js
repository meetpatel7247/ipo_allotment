import mongoose from 'mongoose';

// IPO Schema
const IPOSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true, unique: true },
  clientId: { type: String, required: true, unique: true },
  registrar: { type: String, required: true, enum: ['KFintech', 'Link Intime', 'Bigshare', 'MUFG'], default: 'KFintech' },
  price: { type: Number, default: 0 },
  lotSize: { type: Number, default: 0 },
  allotmentDate: { type: Date },
  status: { type: String, required: true, enum: ['Active', 'Closed', 'Allotted'], default: 'Active' },
  subscriptionRate: { type: Number, default: 0 }
}, { timestamps: true });

// Check History Schema
const HistorySchema = new mongoose.Schema({
  pan: { type: String, required: false },
  ipoName: { type: String, required: true },
  searchType: { type: String, required: true, enum: ['PAN', 'ApplicationNo', 'DematNo'] },
  searchValue: { type: String, required: true }, // masked value
  status: { type: String, required: true, enum: ['Allotted', 'Not Allotted', 'Invalid Details'] },
  sharesAllotted: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  registrar: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// IPO Bidding Application Schema
const ApplicationSchema = new mongoose.Schema({
  ipoId: { type: String, required: true },
  ipoName: { type: String, required: true },
  category: { type: String, default: 'Retail Individual Investor (RII)' },
  panOrBoIdType: { type: String, enum: ['PAN', 'BO_ID'], required: true },
  panOrBoIdValue: { type: String, required: true }, // masked for privacy
  lotCount: { type: Number, required: true, default: 1 },
  lotSize: { type: Number, required: true, default: 100 },
  cutoffPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  upiId: { type: String, required: true },
  applicationNo: { type: String, required: true, unique: true },
  mandateStatus: { type: String, enum: ['Mandate Sent', 'Approved', 'Submitted to Exchange'], default: 'Mandate Sent' },
  upiDeepLink: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const IPO = mongoose.models.IPO || mongoose.model('IPO', IPOSchema);
export const History = mongoose.models.History || mongoose.model('History', HistorySchema);
export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);

