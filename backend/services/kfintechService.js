import axios from 'axios';

const API_BASE = 'https://0uz601ms56.execute-api.ap-south-1.amazonaws.com/prod/api/query?type=';

const TYPE_MAP = {
  PAN: 'pan',
  ApplicationNo: 'appno',
  DematNo: 'dpclid'
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildReqParam = (searchType, value) => {
  const clean = value.trim().toUpperCase();
  if (searchType === 'PAN') return clean;
  if (searchType === 'ApplicationNo') return clean.includes('|') ? clean : clean;
  if (searchType === 'DematNo') {
    if (clean.startsWith('IN')) return clean;
    if (clean.length === 14) return `IN${clean}`;
    return clean;
  }
  return clean;
};

const mapApplications = (records) =>
  records.map((r) => ({
    applicationNo: r.Appln_No,
    name: r.Name,
    pan: r.Pan_No,
    dpId: r.DP_CLID,
    appliedShares: parseInt(r.App_Shares || 0, 10),
    allottedShares: parseInt(r.All_Shares || 0, 10),
    category: r.category
  }));

const mapResponse = (data) => {
  const records = data?.data || [];
  if (!records.length) {
    return {
      status: 'Not Allotted',
      sharesAllotted: 0,
      amount: 0,
      remarks: 'No allotment record found.',
      applications: []
    };
  }

  const totalShares = records.reduce((sum, r) => sum + parseInt(r.All_Shares || 0, 10), 0);
  const applications = mapApplications(records);

  if (totalShares > 0) {
    return {
      status: 'Allotted',
      sharesAllotted: totalShares,
      amount: 0,
      remarks: `Allotted ${totalShares} share(s).`,
      applications
    };
  }

  return {
    status: 'Not Allotted',
    sharesAllotted: 0,
    amount: 0,
    remarks: 'Applied but not allotted. Refund will be processed.',
    applications
  };
};

export const queryKFintech = async (clientId, searchType, searchValue, retries = 3) => {
  const type = TYPE_MAP[searchType];
  const reqparam = buildReqParam(searchType, searchValue);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await axios.get(`${API_BASE}${type}`, {
        headers: { reqparam, client_id: String(clientId) },
        timeout: 20000
      });
      return mapResponse(res.data);
    } catch (err) {
      const status = err.response?.status;

      if (status === 404) {
        return {
          status: 'Not Allotted',
          sharesAllotted: 0,
          amount: 0,
          remarks: 'No application found for this detail in selected IPO.',
          applications: []
        };
      }

      if (status === 429 && attempt < retries - 1) {
        await delay(2000 * (attempt + 1));
        continue;
      }

      if (status === 429) throw new Error('Too many requests. Please wait and try again.');
      if ([500, 502, 504].includes(status)) throw new Error('KFintech server busy. Please retry.');
      throw new Error(err.response?.data?.error || 'KFintech allotment lookup failed.');
    }
  }
};

export const queryAllIPOs = async (ipos, searchType, searchValue) => {
  console.log(`\n--- KFintech Live Lookup: ${searchType} across ${ipos.length} IPO(s) ---`);

  const results = [];
  const kfintechIpos = ipos.filter((ipo) => ipo.clientId);

  for (const ipo of kfintechIpos) {
    try {
      const outcome = await queryKFintech(ipo.clientId, searchType, searchValue);
      results.push({
        ipoId: ipo._id,
        ipoName: ipo.name,
        ipoSymbol: ipo.symbol,
        price: ipo.price || 0,
        lotSize: ipo.lotSize || 0,
        registrar: 'KFintech',
        ...outcome
      });
    } catch (err) {
      results.push({
        ipoId: ipo._id,
        ipoName: ipo.name,
        ipoSymbol: ipo.symbol,
        price: ipo.price || 0,
        lotSize: ipo.lotSize || 0,
        registrar: 'KFintech',
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
      registrar: 'KFintech',
      checkedCount: kfintechIpos.length,
      status: kfintechIpos.length > 0 ? 'Success' : 'No Record Found'
    }],
    results
  };
};

export const queryBulkIPOs = async (ipo, searchType, values) => {
  console.log(`\n--- KFintech Bulk Lookup: ${values.length} records for ${ipo.name} ---`);

  const results = [];

  for (const val of values) {
    const key = val.trim().toUpperCase();
    try {
      const outcome = await queryKFintech(ipo.clientId, searchType, val);
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
      registrar: 'KFintech',
      checkedCount: values.length,
      status: 'Success'
    }],
    results
  };
};
