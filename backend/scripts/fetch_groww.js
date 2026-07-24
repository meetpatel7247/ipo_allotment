import axios from 'axios';

async function findGrowwApi() {
  try {
    const res = await axios.get('https://groww.in/ipo', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const html = res.data;
    
    // Find all script tags src
    const scriptSrcs = [];
    const scriptRegex = /src="([^"]+\.js[^"]*)"/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      scriptSrcs.push(match[1]);
    }
    
    console.log(`Found ${scriptSrcs.length} script tags.`);
    
    for (const src of scriptSrcs) {
      let fullUrl = src;
      if (src.startsWith('//')) {
        fullUrl = `https:${src}`;
      } else if (src.startsWith('/')) {
        fullUrl = `https://groww.in${src}`;
      }
      
      try {
        console.log('Fetching JS script:', fullUrl);
        const jsRes = await axios.get(fullUrl, { timeout: 8000 });
        const jsCode = jsRes.data;
        const apiEndpts = jsCode.match(/https?:\/\/[a-zA-Z0-9_.\/-]*ipo[a-zA-Z0-9_.\/-]*/g) || jsCode.match(/\/v1\/api\/[a-zA-Z0-9_\/]+/g);
        if (apiEndpts) {
          console.log('--- FOUND API ENDPOINTS IN:', fullUrl, '---');
          console.log(Array.from(new Set(apiEndpts)).slice(0, 15));
        }
      } catch (e) {
        console.error('Failed script:', fullUrl, e.message);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

findGrowwApi();
