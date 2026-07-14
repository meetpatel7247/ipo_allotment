import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KFINTECH_IPOS_FILE = path.join(__dirname, '../data/kfintech_ipos.json');
const KFINTECH_URL = 'https://ipostatus.kfintech.com/';

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

    const existing = await getIPOs();
    const existingClientIds = new Set(existing.map(ipo => ipo.clientId));
    const usedSymbols = new Set(existing.map(ipo => ipo.symbol));
    let newIposCount = 0;
    
    for (const item of kfintechList) {
      if (existingClientIds.has(item.clientId)) {
        continue; // Already seeded
      }
      
      let symbol = makeSymbol(item.name, item.clientId);
      let suffix = 1;
      while (usedSymbols.has(symbol)) {
        symbol = `${makeSymbol(item.name, item.clientId)}${suffix}`;
        suffix++;
      }
      usedSymbols.add(symbol);

      await addIPO({
        name: item.name,
        symbol,
        clientId: item.clientId,
        registrar: 'KFintech',
        price: 0,
        lotSize: 0,
        status: 'Active',
        subscriptionRate: 0
      });
      newIposCount++;
    }
    
    if (newIposCount > 0) {
      console.log(`Seeded ${newIposCount} new KFintech IPOs.`);
    } else {
      console.log('No new IPOs found. Database is up to date.');
    }
  } catch (error) {
    console.error(`Failed to seed KFintech IPOs: ${error.message}`);
  }
};

// Backward-compatible export name
export const seedDefaultIPOs = seedKFintechIPOs;
