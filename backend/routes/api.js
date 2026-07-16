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

export default router;
