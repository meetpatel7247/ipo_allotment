import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'https://in.mpms.mufg.com/Initial_Offer/IPO.aspx';

const SEARCH_TYPE_MAP = {
  PAN: '1',
  ApplicationNo: '2',
  DematNo: '3'
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const extractTag = (xmlStr, tagName) => {
  const match = xmlStr.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? match[1].trim() : '';
};

const encryptToken = (token) => {
  const key = Buffer.from('8080808080808080', 'utf8');
  const iv = Buffer.from('8080808080808080', 'utf8');
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

export const getCompanyId = (clientId) => String(clientId).replace(/^MUFG_/i, '');

export const fetchLiveMUFGIPOs = async () => {
  try {
    console.log('Fetching live MUFG IPO list...');
    const res = await axios.post(`${BASE_URL}/GetDetails`, {}, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 20000
    });

    const xmlData = res.data?.d || '';
    const tableRegex = /<Table>([\s\S]*?)<\/Table>/g;
    const ipos = [];
    const seen = new Set();
    let match;

    while ((match = tableRegex.exec(xmlData)) !== null) {
      const tableContent = match[1];
      const companyId = extractTag(tableContent, 'company_id');
      const companyName = decodeHtmlEntities(extractTag(tableContent, 'companyname'));

      if (companyId && companyName && !seen.has(companyId)) {
        seen.add(companyId);
        ipos.push({ companyId, name: companyName });
      }
    }

    console.log(`Successfully extracted ${ipos.length} IPOs from MUFG.`);
    return ipos;
  } catch (err) {
    console.error(`MUFG fetch active IPOs failed: ${err.message}`);
    return null;
  }
};

export const queryMUFG = async (clientId, searchType, searchValue, price = 0, retries = 3) => {
  const cleanId = getCompanyId(clientId);
  const chkVal = SEARCH_TYPE_MAP[searchType];
  const value = searchValue.trim().toUpperCase();

  if (!chkVal) {
    throw new Error(`Unsupported search type: ${searchType}`);
  }

  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // 1. Generate dynamic token
      const tokenRes = await axios.post(`${BASE_URL}/generateToken`, {}, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
      });
      const rawToken = tokenRes.data?.d;
      if (!rawToken) {
        throw new Error('Failed to generate token from MUFG.');
      }

      // 2. Encrypt token
      const encryptedToken = encryptToken(rawToken);

      // 3. Search On PAN/APP/Demat
      const payload = {
        clientid: cleanId,
        PAN: value,
        IFSC: '',
        CHKVAL: chkVal,
        token: encryptedToken
      };

      const searchRes = await axios.post(`${BASE_URL}/SearchOnPan`, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 20000
      });

      const responseXml = searchRes.data?.d || '';

      // Check for error table (Table1)
      const errorMsg = extractTag(responseXml, 'Msg');
      if (errorMsg) {
        return {
          status: 'Invalid Details',
          sharesAllotted: 0,
          amount: 0,
          remarks: errorMsg,
          applications: []
        };
      }

      // Parse success records (Table)
      const tableRegex = /<Table>([\s\S]*?)<\/Table>/g;
      const tables = [];
      let match;
      while ((match = tableRegex.exec(responseXml)) !== null) {
        tables.push(match[1]);
      }

      if (tables.length === 0) {
        return {
          status: 'Not Allotted',
          sharesAllotted: 0,
          amount: 0,
          remarks: 'No application found for this detail in selected IPO.',
          applications: []
        };
      }

      let totalAllotted = 0;
      let totalApplied = 0;
      let totalAmountAdjusted = 0;
      const applications = [];

      for (const table of tables) {
        const name = decodeHtmlEntities(extractTag(table, 'NAME1'));
        const allotted = parseInt(extractTag(table, 'ALLOT') || '0', 10) || 0;
        const applied = parseInt(extractTag(table, 'SHARES') || '0', 10) || 0;
        const amountAdjusted = parseFloat(extractTag(table, 'AMTADJ') || '0') || 0;
        const dpId = extractTag(table, 'DPCLITID') || '';
        const category = extractTag(table, 'PEMNDG') || '';
        const refNo = extractTag(table, 'RFNDNO') || '';

        totalAllotted += allotted;
        totalApplied += applied;
        totalAmountAdjusted += amountAdjusted;

        applications.push({
          applicationNo: refNo, // Map refund number or similar unique detail if appNo missing
          name,
          pan: '',
          dpId,
          appliedShares: applied,
          allottedShares: allotted,
          category
        });
      }

      const calculatedAmount = totalAllotted * price;
      // Prefer totalAmountAdjusted if positive, fallback to price-based calculation
      const finalAmount = totalAmountAdjusted > 0 ? totalAmountAdjusted : (calculatedAmount > 0 ? calculatedAmount : 0);

      if (totalAllotted > 0) {
        return {
          status: 'Allotted',
          sharesAllotted: totalAllotted,
          amount: finalAmount,
          remarks: `Allotted ${totalAllotted} share(s).`,
          applications
        };
      }

      return {
        status: 'Not Allotted',
        sharesAllotted: 0,
        amount: 0,
        remarks: totalApplied > 0 ? 'Applied but not allotted. Refund will be processed.' : 'No allotment record found.',
        applications
      };

    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      console.warn(`MUFG query failed on attempt ${attempt + 1}: ${err.message}`);

      if (status === 429 && attempt < retries - 1) {
        await delay(2000 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  throw new Error(lastError?.response?.data?.Message || lastError?.message || 'MUFG allotment lookup failed.');
};

export const queryAllIPOs = async (ipos, searchType, searchValue) => {
  console.log(`\n--- MUFG Live Lookup: ${searchType} across ${ipos.length} IPO(s) ---`);

  const results = [];
  const mufgIpos = ipos.filter((ipo) => ipo.registrar === 'MUFG' && ipo.clientId);

  for (const ipo of mufgIpos) {
    try {
      const outcome = await queryMUFG(ipo.clientId, searchType, searchValue, ipo.price || 0);
      results.push({
        ipoId: ipo._id,
        ipoName: ipo.name,
        ipoSymbol: ipo.symbol,
        price: ipo.price || 0,
        lotSize: ipo.lotSize || 0,
        registrar: 'MUFG',
        ...outcome
      });
    } catch (err) {
      results.push({
        ipoId: ipo._id,
        ipoName: ipo.name,
        ipoSymbol: ipo.symbol,
        price: ipo.price || 0,
        lotSize: ipo.lotSize || 0,
        registrar: 'MUFG',
        status: 'Invalid Details',
        sharesAllotted: 0,
        amount: 0,
        remarks: err.message,
        applications: []
      });
    }
    await delay(450);
  }

  return {
    success: results.length > 0,
    allRegistrarsDetails: [{
      registrar: 'MUFG',
      checkedCount: mufgIpos.length,
      status: mufgIpos.length > 0 ? 'Success' : 'No Record Found'
    }],
    results
  };
};

export const queryBulkIPOs = async (ipo, searchType, values) => {
  console.log(`\n--- MUFG Bulk Lookup: ${values.length} records for ${ipo.name} ---`);

  const results = [];

  for (const val of values) {
    const key = val.trim().toUpperCase();
    try {
      const outcome = await queryMUFG(ipo.clientId, searchType, val, ipo.price || 0);
      results.push({ searchKey: key, ...outcome });
    } catch (err) {
      results.push({
        searchKey: key,
        status: 'Invalid Details',
        sharesAllotted: 0,
        amount: 0,
        remarks: err.message,
        applications: []
      });
    }
    await delay(500);
  }

  return {
    success: true,
    allRegistrarsDetails: [{
      registrar: 'MUFG',
      checkedCount: values.length,
      status: 'Success'
    }],
    results
  };
};
