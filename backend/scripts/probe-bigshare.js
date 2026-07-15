import axios from 'axios';

const BASE = 'https://ipo.bigshareonline.com';

const htmlRes = await axios.get(`${BASE}/ipo_status.html`, { timeout: 15000 });
const html = htmlRes.data;

// Extract active IPO list (non-commented options only)
const companyBlock = html.match(/<select id="ddlCompany">([\s\S]*?)<\/select>/i)?.[1] || '';
const activeLines = companyBlock.split('\n').filter((line) => !line.trim().startsWith('<!--'));
const optionRegex = /<option value="(\d+)">([^<]+)<\/option>/;
const ipos = [];
for (const line of activeLines) {
  const m = line.match(optionRegex);
  if (m && !m[2].includes('Select Company')) {
    ipos.push({ companyId: m[1], name: m[2].trim() });
  }
}
console.log('Active IPOs:', ipos.length, ipos);

const selBlock = html.match(/<select id="SelectionType">([\s\S]*?)<\/select>/i)?.[1] || '';
console.log('\nSelectionType block:', selBlock);

// Try API call without captcha
const testPayload = {
  Applicationno: '',
  Company: ipos[0]?.companyId || '9042',
  SelectionType: '3', // PAN
  PanNo: 'ABCDE1234F',
  txtcsdl: '',
  txtDPID: '',
  txtClId: '',
  ddlType: '',
  lang: 'en'
};

try {
  const res = await axios.post(`${BASE}/Data.aspx/FetchIpodetails`, testPayload, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    timeout: 20000
  });
  console.log('\nAPI Response:', JSON.stringify(res.data, null, 2));
} catch (err) {
  console.log('\nAPI Error:', err.response?.status, err.response?.data || err.message);
}
