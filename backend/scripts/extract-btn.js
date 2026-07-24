import axios from 'axios';
import fs from 'fs';

const html = (await axios.get('https://ipo.bigshareonline.com/ipo_status.html')).data;
const idx = html.indexOf("$('#btn_Search').click");
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, 'btn-search.js.txt'), html.substring(idx, idx + 12000));
console.log('Written', idx);
