import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { fetchLiveBigshareIPOs } from '../services/bigshareService.js';
import { fetchLiveMUFGIPOs } from '../services/mufgService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KFINTECH_IPOS_FILE = path.join(__dirname, '../data/kfintech_ipos.json');
const BIGSHARE_IPOS_FILE = path.join(__dirname, '../data/bigshare_ipos.json');
const MUFG_IPOS_FILE = path.join(__dirname, '../data/mufg_ipos.json');
const KFINTECH_URL = 'https://ipostatus.kfintech.com/';

const makeBigshareClientId = (companyId) => `BS_${companyId}`;
const makeMufgClientId = (companyId) => `MUFG_${companyId}`;

const loadMufgIPOs = () => {
  if (!fs.existsSync(MUFG_IPOS_FILE)) {
    console.warn('mufg_ipos.json not found.');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(MUFG_IPOS_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Error reading MUFG JSON file: ${err.message}`);
    return [];
  }
};

const loadBigshareIPOs = () => {
  if (!fs.existsSync(BIGSHARE_IPOS_FILE)) {
    console.warn('bigshare_ipos.json not found.');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(BIGSHARE_IPOS_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Error reading Bigshare JSON file: ${err.message}`);
    return [];
  }
};

const makeSymbol = (name, clientId) => {
  const words = name.replace(/[^A-Z0-9\s]/gi, '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase().slice(0, 8);
  }
  const compact = name.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return compact.slice(0, 8) || `IPO${clientId.slice(-6)}`;
};

const loadKFintechIPOs = () => {
  if (!fs.existsSync(KFINTECH_IPOS_FILE)) {
    console.warn('kfintech_ipos.json not found.');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(KFINTECH_IPOS_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Error reading local JSON file: ${err.message}`);
    return [];
  }
};

export const fetchLiveKFintechIPOs = async () => {
  try {
    console.log('Fetching live KFintech homepage...');
    const homeRes = await axios.get(KFINTECH_URL, { timeout: 10000 });
    const html = homeRes.data;
    
    // Find script src matching main.[a-f0-9]+.js
    const scriptRegex = /src="(\.\/static\/js\/main\.[a-f0-9]+\.js)"/;
    const match = html.match(scriptRegex);
    if (!match) {
      throw new Error('Could not find main JS bundle script tag on KFintech home page');
    }
    
    const scriptPath = match[1].replace('./', '');
    const scriptUrl = `${KFINTECH_URL}${scriptPath}`;
    console.log(`Fetching KFintech main bundle: ${scriptUrl}`);
    
    const jsRes = await axios.get(scriptUrl, { timeout: 15000 });
    const jsCode = jsRes.data;
    
    const searchPattern = 'rf=JSON.parse(';
    const start = jsCode.indexOf(searchPattern);
    if (start === -1) {
      throw new Error('Could not find rf=JSON.parse in KFintech main JS bundle');
    }
    
    const quoteChar = jsCode[start + searchPattern.length];
    const stringStart = start + searchPattern.length + 1;
    let stringEnd = -1;
    
    for (let i = stringStart; i < jsCode.length; i++) {
      if (jsCode[i] === quoteChar) {
        let backslashes = 0;
        for (let j = i - 1; j >= stringStart; j--) {
          if (jsCode[j] === '\\') {
            backslashes++;
          } else {
            break;
          }
        }
        if (backslashes % 2 === 0) {
          stringEnd = i;
          break;
        }
      }
    }
    
    if (stringEnd === -1) {
      throw new Error('Could not find closing unescaped quote for IPO list in JS bundle');
    }
    
    const rawJsonStr = jsCode.substring(stringStart, stringEnd);
    let jsonStr = rawJsonStr;
    if (quoteChar === "'") {
      jsonStr = rawJsonStr.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    }
    
    const ipos = JSON.parse(jsonStr);
    console.log(`Successfully extracted ${ipos.length} IPOs from live KFintech bundle.`);
    return ipos;
  } catch (error) {
    console.warn(`Failed to fetch live KFintech IPOs: ${error.message}`);
    return null;
  }
};

const seedRegistrarIPOs = async ({
  registrar,
  ipoList,
  backupFile,
  getIPOs,
  addIPO,
  toClientId,
  logLabel
}) => {
  if (!ipoList || ipoList.length === 0) {
    console.warn(`No ${logLabel} IPOs to seed.`);
    return;
  }

  const existing = await getIPOs();
  const existingClientIds = new Set(existing.map((ipo) => ipo.clientId));
  const usedSymbols = new Set(existing.map((ipo) => ipo.symbol));
  let newIposCount = 0;

  for (const item of ipoList) {
    const clientId = toClientId(item);
    if (existingClientIds.has(clientId)) continue;

    let symbol = makeSymbol(item.name, clientId);
    let suffix = 1;
    while (usedSymbols.has(symbol)) {
      symbol = `${makeSymbol(item.name, clientId)}${suffix}`;
      suffix++;
    }
    usedSymbols.add(symbol);

    // Generate realistic pricing data for IPO bidding
    const basePrice = item.price || Math.floor(Math.random() * 250) + 75;
    const defaultLotSize = item.lotSize || (basePrice > 200 ? 60 : basePrice > 100 ? 100 : 150);

    await addIPO({
      name: item.name,
      symbol,
      clientId,
      registrar,
      price: basePrice,
      cutoffPrice: basePrice,
      lotSize: defaultLotSize,
      category: item.name.toLowerCase().includes('sme') ? 'SME' : 'Mainboard',
      biddingStatus: Math.random() > 0.3 ? 'OPEN' : 'PRE_APPLY',
      status: 'Active',
      subscriptionRate: item.subscriptionRate || parseFloat((Math.random() * 30 + 1.2).toFixed(2))
    });
    newIposCount++;
  }

  if (newIposCount > 0) {
    console.log(`Seeded ${newIposCount} new ${logLabel} IPOs.`);
  } else {
    console.log(`No new ${logLabel} IPOs found. Database is up to date.`);
  }
};

export const seedBigshareIPOs = async (getIPOs, addIPO) => {
  try {
    let bigshareList = await fetchLiveBigshareIPOs();

    if (!bigshareList || bigshareList.length === 0) {
      console.warn('Falling back to local bigshare_ipos.json...');
      bigshareList = loadBigshareIPOs();
    } else {
      try {
        if (!fs.existsSync(path.dirname(BIGSHARE_IPOS_FILE))) {
          fs.mkdirSync(path.dirname(BIGSHARE_IPOS_FILE), { recursive: true });
        }
        fs.writeFileSync(BIGSHARE_IPOS_FILE, JSON.stringify(bigshareList, null, 2));
        console.log('Saved live IPO list to local backup: bigshare_ipos.json');
      } catch (err) {
        console.warn(`Failed to write local backup of Bigshare IPO list: ${err.message}`);
      }
    }

    await seedRegistrarIPOs({
      registrar: 'Bigshare',
      ipoList: bigshareList,
      backupFile: BIGSHARE_IPOS_FILE,
      getIPOs,
      addIPO,
      toClientId: (item) => makeBigshareClientId(item.companyId),
      logLabel: 'Bigshare'
    });
  } catch (error) {
    console.error(`Failed to seed Bigshare IPOs: ${error.message}`);
  }
};

export const seedKFintechIPOs = async (getIPOs, addIPO, clearAll) => {
  try {
    let kfintechList = await fetchLiveKFintechIPOs();
    
    if (!kfintechList || kfintechList.length === 0) {
      console.warn('Falling back to local kfintech_ipos.json...');
      kfintechList = loadKFintechIPOs();
    } else {
      // Save it locally as backup/cache
      try {
        if (!fs.existsSync(path.dirname(KFINTECH_IPOS_FILE))) {
          fs.mkdirSync(path.dirname(KFINTECH_IPOS_FILE), { recursive: true });
        }
        fs.writeFileSync(KFINTECH_IPOS_FILE, JSON.stringify(kfintechList, null, 2));
        console.log('Saved live IPO list to local backup: kfintech_ipos.json');
      } catch (err) {
        console.warn(`Failed to write local backup of live IPO list: ${err.message}`);
      }
    }
    
    if (kfintechList.length === 0) {
      console.warn('No KFintech IPOs to seed.');
      return;
    }

    await seedRegistrarIPOs({
      registrar: 'KFintech',
      ipoList: kfintechList,
      backupFile: KFINTECH_IPOS_FILE,
      getIPOs,
      addIPO,
      toClientId: (item) => item.clientId,
      logLabel: 'KFintech'
    });
  } catch (error) {
    console.error(`Failed to seed KFintech IPOs: ${error.message}`);
  }
};

export const seedMUFGIPOs = async (getIPOs, addIPO) => {
  try {
    let mufgList = await fetchLiveMUFGIPOs();

    if (!mufgList || mufgList.length === 0) {
      console.warn('Falling back to local mufg_ipos.json...');
      mufgList = loadMufgIPOs();
    } else {
      try {
        if (!fs.existsSync(path.dirname(MUFG_IPOS_FILE))) {
          fs.mkdirSync(path.dirname(MUFG_IPOS_FILE), { recursive: true });
        }
        fs.writeFileSync(MUFG_IPOS_FILE, JSON.stringify(mufgList, null, 2));
        console.log('Saved live IPO list to local backup: mufg_ipos.json');
      } catch (err) {
        console.warn(`Failed to write local backup of MUFG IPO list: ${err.message}`);
      }
    }

    await seedRegistrarIPOs({
      registrar: 'MUFG',
      ipoList: mufgList,
      backupFile: MUFG_IPOS_FILE,
      getIPOs,
      addIPO,
      toClientId: (item) => makeMufgClientId(item.companyId),
      logLabel: 'MUFG'
    });
  } catch (error) {
    console.error(`Failed to seed MUFG IPOs: ${error.message}`);
  }
};

export const seedAllIPOs = async (getIPOs, addIPO, clearAll) => {
  await seedKFintechIPOs(getIPOs, addIPO, clearAll);
  await seedBigshareIPOs(getIPOs, addIPO);
  await seedMUFGIPOs(getIPOs, addIPO);
};

// Backward-compatible export name
export const seedDefaultIPOs = seedAllIPOs;
