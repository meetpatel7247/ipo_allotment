import axios from 'axios';

const API_BASE = 'https://ipo.bigshareonline.com';
const IPO_LIST_URLS = [
  'https://www.bigshareonline.com/ipo_allotment.html',
  'https://ipo.bigshareonline.com/ipo_status.html',
  'https://ipo1.bigshareonline.com/ipo_status.html',
  'https://ipo2.bigshareonline.com/ipo_status.html'
];

const SEARCH_TYPE_MAP = {
  PAN: 'PN',
  ApplicationNo: 'AP',
  DematNo: 'BN'
};

const ERROR_MESSAGES = new Set([
  'No data found',
  'Please Enter Valid Application No',
  'Please Enter Valid Pan No',
  'Please Enter Valid Beneficiary ID',
  'Please Enter Valid CLID',
  'Please Enter Valid DPID'
]);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCompanyId = (clientId) => String(clientId).replace(/^BS_/i, '');

const buildDematFields = (value) => {
  const clean = value.trim().toUpperCase();

  if (/^\d{16}$/.test(clean)) {
    return { ddlType: 'CDSL', txtcsdl: clean, txtDPID: '', txtClId: '' };
  }

  let demat = clean;
  if (!demat.startsWith('IN') && /^\d{14}$/.test(demat)) {
    demat = `IN${demat}`;
  }

  if (/^IN\d{6}\d{8}$/.test(demat)) {
    return { ddlType: 'NSDL', txtDPID: demat.slice(0, 8), txtClId: demat.slice(8), txtcsdl: '' };
  }

  if (demat.startsWith('IN') && demat.length >= 16) {
    return { ddlType: 'NSDL', txtDPID: demat.slice(0, 8), txtClId: demat.slice(8, 16), txtcsdl: '' };
  }

  throw new Error('Invalid Demat format. Use 16-digit CDSL ID or NSDL DP ID (IN + 14 digits).');
};

const buildPayload = (companyId, searchType, searchValue) => {
  const payload = {
    Applicationno: '',
    Company: getCompanyId(companyId),
    SelectionType: SEARCH_TYPE_MAP[searchType],
    PanNo: '',
    txtcsdl: '',
    txtDPID: '',
    txtClId: '',
    ddlType: '',
    lang: 'en'
  };

  if (searchType === 'PAN') {
    payload.PanNo = searchValue.trim().toUpperCase();
  } else if (searchType === 'ApplicationNo') {
    payload.Applicationno = searchValue.trim();
  } else {
    Object.assign(payload, buildDematFields(searchValue));
  }

  return payload;
};

const mapResponse = (data, price = 0) => {
  const record = data?.d;
  if (!record || ERROR_MESSAGES.has(record.DPID)) {
    const isNotFound = record?.DPID === 'No data found';
    return {
      status: 'Not Allotted',
      sharesAllotted: 0,
      amount: 0,
      remarks: isNotFound
        ? 'No application found for this detail in selected IPO.'
        : (record?.DPID || 'No allotment record found.'),
      applications: []
    };
  }

  const appliedShares = parseInt(String(record.APPLIED || '0').replace(/[^\d]/g, ''), 10) || 0;
  const allottedShares = parseInt(String(record.ALLOTED || '0').replace(/[^\d]/g, ''), 10) || 0;
  const applications = [{
    applicationNo: record.APPLICATION_NO || '',
    name: record.Name || '',
    pan: '',
    dpId: record.DPID || '',
    appliedShares,
    allottedShares,
    category: ''
  }];

  if (allottedShares > 0) {
    return {
      status: 'Allotted',
      sharesAllotted: allottedShares,
      amount: price > 0 ? allottedShares * price : 0,
      remarks: `Allotted ${allottedShares} share(s).`,
      applications
    };
  }

  return {
    status: 'Not Allotted',
    sharesAllotted: 0,
    amount: 0,
    remarks: appliedShares > 0
      ? 'Applied but not allotted. Refund will be processed.'
      : 'No allotment record found.',
    applications
  };
};

export const fetchLiveBigshareIPOs = async () => {
  for (const url of IPO_LIST_URLS) {
    try {
      console.log(`Fetching Bigshare IPO list: ${url}`);
      const res = await axios.get(url, { timeout: 15000 });
      const html = res.data;
      if (!html.includes('ddlCompany')) continue;

      const companyBlock = html.match(/<select id="ddlCompany">([\s\S]*?)<\/select>/i)?.[1] || '';
      const activeLines = companyBlock.split('\n').filter((line) => !line.trim().startsWith('<!--'));
      const optionRegex = /<option value="(\d+)">([^<]+)<\/option>/i;
      const seen = new Set();
      const ipos = [];

      for (const line of activeLines) {
        const match = line.match(optionRegex);
        if (!match || match[2].includes('Select Company')) continue;
        const companyId = match[1];
        if (seen.has(companyId)) continue;
        seen.add(companyId);
        ipos.push({ companyId, name: match[2].trim() });
      }

      if (ipos.length > 0) {
        console.log(`Successfully extracted ${ipos.length} IPOs from Bigshare (${url}).`);
        return ipos;
      }
    } catch (err) {
      console.warn(`Bigshare fetch failed for ${url}: ${err.message}`);
    }
  }

  return null;
};

export const queryBigshare = async (clientId, searchType, searchValue, price = 0, retries = 3) => {
  const payload = buildPayload(clientId, searchType, searchValue);
  
  const servers = [
    'https://ipo.bigshareonline.com',
    'https://ipo1.bigshareonline.com',
    'https://ipo2.bigshareonline.com'
  ];

  let lastError = null;

  for (const server of servers) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`Querying Bigshare allotment on server: ${server} (attempt ${attempt + 1})...`);
        const res = await axios.post(`${server}/Data.aspx/FetchIpodetails`, payload, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          timeout: 20000
        });
        return mapResponse(res.data, price);
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        console.warn(`Bigshare query failed on server ${server} (attempt ${attempt + 1}): ${err.message}`);

        if (status === 404) {
          // If 404, maybe this server is misconfigured or doesn't host it, try next server
          break;
        }

        if ([500, 502, 503, 504].includes(status) && attempt < retries - 1) {
          await delay(1500 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }

  const status = lastError?.response?.status;
  if ([500, 502, 503, 504].includes(status)) {
    throw new Error('Bigshare server busy. Please retry.');
  }

  throw new Error(lastError?.response?.data?.Message || lastError?.message || 'Bigshare allotment lookup failed.');
};

export const queryAllIPOs = async (ipos, searchType, searchValue) => {
  console.log(`\n--- Bigshare Live Lookup: ${searchType} across ${ipos.length} IPO(s) ---`);

  const results = [];
  const bigshareIpos = ipos.filter((ipo) => ipo.registrar === 'Bigshare' && ipo.clientId);

  for (const ipo of bigshareIpos) {
    try {
      const outcome = await queryBigshare(ipo.clientId, searchType, searchValue, ipo.price || 0);
      results.push({
        ipoId: ipo._id,
        ipoName: ipo.name,
        ipoSymbol: ipo.symbol,
        price: ipo.price || 0,
        lotSize: ipo.lotSize || 0,
        registrar: 'Bigshare',
        ...outcome
      });
    } catch (err) {
      results.push({
        ipoId: ipo._id,
        ipoName: ipo.name,
        ipoSymbol: ipo.symbol,
        price: ipo.price || 0,
        lotSize: ipo.lotSize || 0,
        registrar: 'Bigshare',
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
      registrar: 'Bigshare',
      checkedCount: bigshareIpos.length,
      status: bigshareIpos.length > 0 ? 'Success' : 'No Record Found'
    }],
    results
  };
};

export const queryBulkIPOs = async (ipo, searchType, values) => {
  console.log(`\n--- Bigshare Bulk Lookup: ${values.length} records for ${ipo.name} ---`);

  const results = [];

  for (const val of values) {
    const key = val.trim().toUpperCase();
    try {
      const outcome = await queryBigshare(ipo.clientId, searchType, val, ipo.price || 0);
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
      registrar: 'Bigshare',
      checkedCount: values.length,
      status: 'Success'
    }],
    results
  };
};
