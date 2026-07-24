import express from 'express';
import { getIPOs, getHistory, addHistory, clearAll, addIPO } from '../config/db.js';
import { queryAllIPOs, queryBulkIPOs } from '../services/allotmentService.js';
import { seedAllIPOs } from '../config/seed.js';

const router = express.Router();

// Helper to mask credentials and save to database logs
const logSearch = async (ipoName, searchType, value, registrar, result) => {
  let masked = value.toUpperCase();
  if (searchType === 'PAN') {
    masked = `${masked.slice(0, 5)}****${masked.slice(9)}`;
  } else if (masked.length > 6) {
    masked = `${masked.slice(0, 3)}****${masked.slice(masked.length - 3)}`;
  }
  return await addHistory({
    pan: searchType === 'PAN' ? masked : undefined,
    ipoName, searchType, searchValue: masked,
    status: result.status, sharesAllotted: result.sharesAllotted,
    amount: result.amount, registrar, timestamp: new Date()
  });
};

// Route: Get all IPOs
router.get('/ipos', async (req, res) => {
  try {
    res.json(await getIPOs());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IPOs.' });
  }
});

// Route: Get query history
router.get('/history', async (req, res) => {
  try {
    res.json(await getHistory());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// Route: Check allotment for all or selected IPOs
router.post('/check-allotment', async (req, res) => {
  try {
    const { ipoId, searchType, searchValue } = req.body;
    if (!searchType || !searchValue) {
      return res.status(400).json({ error: 'searchType and searchValue are required.' });
    }
    if (!['PAN', 'ApplicationNo', 'DematNo'].includes(searchType)) {
      return res.status(400).json({ error: 'Invalid searchType.' });
    }

    const cleanValue = searchValue.trim();
    if (searchType === 'PAN') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
      if (cleanValue.length !== 10 || !panRegex.test(cleanValue)) {
        return res.status(400).json({ error: 'PAN must be exactly 10 characters long (e.g. ABCDE1234F).' });
      }
    }

    const ipos = await getIPOs();
    if (ipos.length === 0) return res.status(404).json({ error: 'No active IPOs found.' });

    let targetIpos = ipos;
    if (ipoId && ipoId !== 'ALL') {
      const matched = ipos.find(i => String(i._id) === String(ipoId));
      if (!matched) return res.status(404).json({ error: 'Selected IPO not found.' });
      targetIpos = [matched];
    }

    const queryResult = await queryAllIPOs(targetIpos, searchType, cleanValue.toUpperCase());
    const historyPromises = queryResult.results.map(r => 
      logSearch(r.ipoName, searchType, cleanValue, r.registrar, r)
    );
    await Promise.all(historyPromises);

    res.json({
      success: queryResult.success,
      allRegistrarsDetails: queryResult.allRegistrarsDetails,
      results: queryResult.results
    });
  } catch (error) {
    res.status(500).json({ error: 'Allotment check failed. Server error.' });
  }
});

// Route: Check bulk allotment for an IPO
router.post('/check-bulk-allotment', async (req, res) => {
  try {
    const { ipoId, searchType, values } = req.body;
    if (!ipoId || !searchType || !values || !Array.isArray(values)) {
      return res.status(400).json({ error: 'ipoId, searchType, and values array are required.' });
    }
    if (!['PAN', 'ApplicationNo', 'DematNo'].includes(searchType)) {
      return res.status(400).json({ error: 'Invalid searchType.' });
    }
    if (values.length === 0) return res.status(400).json({ error: 'Values array cannot be empty.' });

    const ipos = await getIPOs();
    const ipo = ipos.find(i => String(i._id) === String(ipoId));
    if (!ipo) return res.status(404).json({ error: 'Selected IPO not found.' });

    if (!ipo.clientId) {
      return res.status(400).json({ error: 'Selected IPO is missing registrar client ID.' });
    }

    if (!['KFintech', 'Bigshare', 'MUFG'].includes(ipo.registrar)) {
      return res.status(400).json({ error: `Bulk allotment is not supported for registrar: ${ipo.registrar}.` });
    }

    const queryResult = await queryBulkIPOs(ipo, searchType, values);
    const historyPromises = queryResult.results.map(r => 
      logSearch(ipo.name, searchType, r.searchKey, ipo.registrar, r)
    );
    await Promise.all(historyPromises);

    res.json({
      success: true,
      allRegistrarsDetails: queryResult.allRegistrarsDetails,
      results: queryResult.results
    });
  } catch (error) {
    res.status(500).json({ error: 'Bulk allotment check failed. Server error.' });
  }
});

// Route: Manual Seeding Trigger
router.post('/admin/seed', async (req, res) => {
  try {
    await clearAll();
    await seedAllIPOs(getIPOs, addIPO, clearAll);
    res.json({ message: 'Database successfully re-seeded.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to re-seed database.' });
  }
});

// ==========================================
// 🚀 DIRECT IN-APP IPO BIDDING & APPLICATIONS
// ==========================================

// Route: Get IPOs available for Bidding / Pre-Apply
router.get('/apply/ipos', async (req, res) => {
  try {
    const ipos = await getIPOs();
    const biddingIpos = ipos.map(ipo => ({
      _id: ipo._id,
      name: ipo.name,
      symbol: ipo.symbol,
      registrar: ipo.registrar,
      price: ipo.price || 150,
      cutoffPrice: ipo.cutoffPrice || ipo.price || 150,
      lotSize: ipo.lotSize || 100,
      category: ipo.category || 'Mainboard',
      biddingStatus: ipo.biddingStatus || 'OPEN',
      status: ipo.status,
      subscriptionRate: ipo.subscriptionRate || 5.2
    }));
    res.json(biddingIpos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bidding IPOs.' });
  }
});

// Route: Submit Direct In-App IPO Application
router.post('/apply', async (req, res) => {
  try {
    const { ipoId, category, panOrBoIdType, panOrBoIdValue, lotCount, upiId } = req.body;

    if (!ipoId || !panOrBoIdType || !panOrBoIdValue || !lotCount || !upiId) {
      return res.status(400).json({ error: 'All fields (ipoId, panOrBoIdType, panOrBoIdValue, lotCount, upiId) are required.' });
    }

    // Validate PAN or BO ID
    const cleanId = panOrBoIdValue.trim().toUpperCase();
    if (panOrBoIdType === 'PAN') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanId)) {
        return res.status(400).json({ error: 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).' });
      }
    } else if (panOrBoIdType === 'BO_ID') {
      const boRegex = /^\d{16}$/;
      if (!boRegex.test(cleanId)) {
        return res.status(400).json({ error: 'Invalid Demat BO ID format. Must be exactly 16 digits.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid panOrBoIdType. Must be PAN or BO_ID.' });
    }

    // Validate UPI ID
    const cleanUpi = upiId.trim().toLowerCase();
    if (!cleanUpi.includes('@') || cleanUpi.length < 5) {
      return res.status(400).json({ error: 'Invalid UPI ID handle (e.g. name@okhdfcbank or 9876543210@paytm).' });
    }

    // Find IPO
    const ipos = await getIPOs();
    const ipo = ipos.find(i => String(i._id) === String(ipoId));
    if (!ipo) {
      return res.status(404).json({ error: 'Selected IPO not found.' });
    }

    const lots = Math.max(1, Math.min(parseInt(lotCount) || 1, 14));
    const lotSize = ipo.lotSize || 100;
    const cutoffPrice = ipo.cutoffPrice || ipo.price || 150;
    const totalAmount = lots * lotSize * cutoffPrice;

    // Mask PAN / BO ID for privacy display
    let maskedValue = cleanId;
    if (panOrBoIdType === 'PAN') {
      maskedValue = `${cleanId.slice(0, 5)}****${cleanId.slice(9)}`;
    } else {
      maskedValue = `${cleanId.slice(0, 4)}********${cleanId.slice(12)}`;
    }

    // Generate Application Reference Number
    const appRandom = Math.floor(100000 + Math.random() * 900000);
    const applicationNo = `IPO2026-NSE-${appRandom}`;

    // Generate UPI AutoPay Deep Link
    const cleanIpoName = ipo.name.replace(/[^a-zA-Z0-9 ]/g, '');
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=NSE+ASBA+IPO+Block&am=${totalAmount}&tr=${applicationNo}&tn=IPO+Bid+for+${encodeURIComponent(cleanIpoName)}&cu=INR`;

    const { addApplication } = await import('../config/db.js');
    const applicationRecord = await addApplication({
      ipoId: String(ipo._id),
      ipoName: ipo.name,
      category: category || 'Retail Individual Investor (RII)',
      panOrBoIdType,
      panOrBoIdValue: maskedValue,
      lotCount: lots,
      lotSize,
      cutoffPrice,
      totalAmount,
      upiId: cleanUpi,
      applicationNo,
      mandateStatus: 'Mandate Sent',
      upiDeepLink,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'IPO Application submitted successfully! Please approve the UPI AutoPay mandate on your UPI app.',
      application: applicationRecord
    });
  } catch (error) {
    console.error('IPO Application submit error:', error);
    res.status(500).json({ error: 'Failed to process IPO Application. Server error.' });
  }
});

// Route: Get user IPO applications
router.get('/apply/applications', async (req, res) => {
  try {
    const { getApplications } = await import('../config/db.js');
    const apps = await getApplications();
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IPO applications.' });
  }
});

// Route: Update Application Mandate Status
router.post('/apply/approve-mandate', async (req, res) => {
  try {
    const { applicationNo, status } = req.body;
    if (!applicationNo) {
      return res.status(400).json({ error: 'applicationNo is required.' });
    }
    const { updateApplicationStatus } = await import('../config/db.js');
    const updated = await updateApplicationStatus(applicationNo, status || 'Approved');
    if (!updated) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    res.json({ success: true, application: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mandate status.' });
  }
});

export default router;

