import axios from 'axios';

const GROWW_OPEN_IPO_URL = 'https://groww.in/v1/api/primaries/v1/ipo/open';
const GROWW_ALL_IPO_URL = 'https://groww.in/v1/api/stocks_primary_market_data/v2/ipo/all?page=0&size=50';

export const fetchGrowwLiveOpenIPOs = async () => {
  try {
    console.log('🔄 Fetching Live Open IPOs directly from Groww API...');
    const response = await axios.get(GROWW_OPEN_IPO_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 10000
    });

    const rawList = response.data.ipoList || [];
    console.log(`✅ Extracted ${rawList.length} Live Open IPOs from Groww.`);

    const formattedOpenIpos = rawList.map((ipo, index) => {
      const regCat = ipo.categories?.find(c => c.category === 'IND') || ipo.categories?.[0] || {};
      const maxPrice = regCat.maxPrice || regCat.minPrice || 150;
      const lotSize = regCat.lotSize || regCat.minBidQuantity || 100;

      return {
        _id: `groww_open_${ipo.companyCode || ipo.symbol || index}`,
        name: ipo.companyName,
        symbol: ipo.symbol,
        registrar: ipo.isSme ? 'Bigshare' : 'KFintech',
        price: maxPrice,
        cutoffPrice: maxPrice,
        lotSize: lotSize,
        category: ipo.isSme ? 'SME' : 'Mainboard',
        biddingStatus: ipo.isPreApply ? 'UPCOMING' : 'OPEN',
        status: 'Active',
        subscriptionRate: ipo.overallSubscription || 1.2,
        logoUrl: ipo.logoUrl,
        closingDate: regCat.bidCutOffTimestamp ? new Date(regCat.bidCutOffTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '27 Jul'
      };
    });

    return formattedOpenIpos;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch live Groww open IPOs: ${error.message}`);
    return null;
  }
};

export const fetchGrowwLiveClosedIPOs = async () => {
  try {
    const response = await axios.get(GROWW_ALL_IPO_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const closedList = response.data?.ipoCompanyListingOrderMap?.CLOSED || [];
    const formattedClosed = closedList.map((ipo, index) => ({
      _id: `groww_closed_${ipo.symbol || index}`,
      name: ipo.growwShortName || ipo.searchId,
      symbol: ipo.symbol,
      registrar: ipo.isSme ? 'Bigshare' : 'KFintech',
      price: ipo.maxPrice || ipo.minPrice || 100,
      cutoffPrice: ipo.maxPrice || ipo.minPrice || 100,
      lotSize: ipo.isSme ? 1000 : 100,
      category: ipo.isSme ? 'SME' : 'Mainboard',
      biddingStatus: 'CLOSED',
      status: 'Closed',
      subscriptionRate: 5.5,
      logoUrl: ipo.logoUrl,
      closingDate: ipo.listingDate || 'Closed'
    }));

    return formattedClosed;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch live Groww closed IPOs: ${error.message}`);
    return [];
  }
};
