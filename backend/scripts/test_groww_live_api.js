import axios from 'axios';

async function printAllOpenIPOs() {
  try {
    const url = 'https://groww.in/v1/api/primaries/v1/ipo/open';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    const ipos = res.data.ipoList || [];
    console.log(`\n================ GROWW OPEN IPOS (${ipos.length}) ================`);
    
    ipos.forEach((ipo, index) => {
      const regCat = ipo.categories?.find(c => c.category === 'IND') || ipo.categories?.[0] || {};
      console.log(`\n[${index + 1}] ${ipo.companyName} (${ipo.symbol})`);
      console.log(`    isSme: ${ipo.isSme}`);
      console.log(`    overallSubscription: ${ipo.overallSubscription}x`);
      console.log(`    lotSize: ${regCat.lotSize || 100}`);
      console.log(`    priceRange: ₹${regCat.minPrice} - ₹${regCat.maxPrice}`);
      console.log(`    isPreApply: ${ipo.isPreApply}`);
      console.log(`    logoUrl: ${ipo.logoUrl}`);
    });

    console.log('\n=======================================================\n');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

printAllOpenIPOs();
