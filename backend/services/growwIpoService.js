import axios from 'axios';

const GROWW_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

const GROWW_OPEN_IPO_URL = 'https://groww.in/v1/api/primaries/v1/ipo/open';
const GROWW_UPCOMING_IPO_URL = 'https://groww.in/v1/api/primaries/v1/ipo/upcoming';
const GROWW_ALL_IPO_URL = 'https://groww.in/v1/api/stocks_primary_market_data/v2/ipo/all?page=0&size=50';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatOpenIpo = (ipo, index) => {
  const regCat = ipo.categories?.find(c => c.category === 'IND') || ipo.categories?.[0] || {};
  const minPrice = regCat.minPrice || 150;
  const maxPrice = regCat.maxPrice || regCat.minPrice || 150;
  const lotSize = regCat.lotSize || regCat.minBidQuantity || 100;

  return {
    _id: `groww_open_${ipo.symbol || ipo.companyCode || index}`,
    name: ipo.companyName,
    symbol: ipo.symbol,
    registrar: ipo.isSme ? 'Bigshare' : 'KFintech',
    price: maxPrice,
    minPrice,
    maxPrice,
    cutoffPrice: maxPrice,
    lotSize,
    category: ipo.isSme ? 'SME' : 'Mainboard',
    biddingStatus: ipo.isPreApply ? 'UPCOMING' : 'OPEN',
    status: 'Active',
    subscriptionRate: ipo.overallSubscription || ipo.totalSubscriptionRate || 0,
    logoUrl: ipo.logoUrl,
    biddingStartDate: ipo.biddingStartDate || null,
    biddingEndDate: ipo.biddingEndDate || (regCat.bidCutOffTimestamp ? new Date(regCat.bidCutOffTimestamp).toISOString().split('T')[0] : null),
    closingDate: regCat.bidCutOffTimestamp
      ? new Date(regCat.bidCutOffTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : formatDate(ipo.biddingEndDate),
    closingTime: ipo.lastBidPlaceTime || '16:00',
    additionalInfo: ipo.additionalTxt || '',
    minInvestment: lotSize * maxPrice,
    retailLimit: 200000,
    documentUrl: ipo.documentUrl || null,
    isPreApply: ipo.isPreApply || false
  };
};

const formatUpcomingIpo = (ipo, index) => {
  const lotSize = ipo.categories?.find(c => c.category === 'IND')?.lotSize || (ipo.isSme ? 1000 : 100);
  const minPrice = ipo.minPrice || 100;
  const maxPrice = ipo.maxPrice || ipo.minPrice || 150;

  return {
    _id: `groww_upcoming_${ipo.symbol || index}`,
    name: ipo.companyName || ipo.growwShortName,
    symbol: ipo.symbol,
    registrar: ipo.isSme ? 'Bigshare' : 'KFintech',
    price: maxPrice,
    minPrice,
    maxPrice,
    cutoffPrice: maxPrice,
    lotSize,
    category: ipo.isSme ? 'SME' : 'Mainboard',
    biddingStatus: 'UPCOMING',
    status: 'Upcoming',
    subscriptionRate: 0,
    logoUrl: ipo.logoUrl,
    biddingStartDate: ipo.biddingStartDate || (ipo.bidStartTimestamp ? new Date(ipo.bidStartTimestamp).toISOString().split('T')[0] : null),
    biddingEndDate: ipo.biddingEndDate || null,
    closingDate: formatDate(ipo.biddingStartDate) || 'TBA',
    closingTime: ipo.dailyStartTime || '10:00',
    additionalInfo: ipo.additionalTxt || 'Opening Soon',
    minInvestment: lotSize * maxPrice,
    retailLimit: 200000,
    documentUrl: ipo.documentUrl || null,
    isPreApply: true
  };
};

const formatClosedIpo = (ipo, index) => {
  const regCat = ipo.categories?.find(c => c.category === 'IND') || {};
  const lotSize = regCat.lotSize || (ipo.isSme ? 1000 : 100);
  const maxPrice = ipo.maxPrice || ipo.minPrice || 100;

  return {
    _id: `groww_closed_${ipo.symbol || index}`,
    name: ipo.growwShortName || ipo.companyName || ipo.searchId,
    symbol: ipo.symbol,
    registrar: ipo.isSme ? 'Bigshare' : 'KFintech',
    price: maxPrice,
    minPrice: ipo.minPrice || maxPrice,
    maxPrice,
    cutoffPrice: maxPrice,
    lotSize,
    category: ipo.isSme ? 'SME' : 'Mainboard',
    biddingStatus: 'CLOSED',
    status: 'Closed',
    subscriptionRate: ipo.totalSubscriptionRate || ipo.overallSubscription || 0,
    logoUrl: ipo.logoUrl,
    biddingStartDate: ipo.biddingStartDate || null,
    biddingEndDate: ipo.biddingEndDate || null,
    closingDate: formatDate(ipo.biddingEndDate) || ipo.listingDate || 'Closed',
    closingTime: ipo.lastBidPlaceTime || null,
    additionalInfo: ipo.additionalTxt || 'Bidding Closed',
    minInvestment: lotSize * maxPrice,
    retailLimit: 200000,
    documentUrl: ipo.documentUrl || null,
    isPreApply: false
  };
};

export const fetchGrowwLiveOpenIPOs = async () => {
  try {
    console.log('🔄 Fetching Live Open IPOs from Groww API...');
    const response = await axios.get(GROWW_OPEN_IPO_URL, { headers: GROWW_HEADERS, timeout: 10000 });
    const rawList = response.data.ipoList || [];
    console.log(`✅ ${rawList.length} Live Open IPOs from Groww.`);
    return rawList.map(formatOpenIpo);
  } catch (error) {
    console.warn(`⚠️ Failed to fetch live Groww open IPOs: ${error.message}`);
    return null;
  }
};

export const fetchGrowwUpcomingIPOs = async () => {
  try {
    console.log('🔄 Fetching Upcoming IPOs from Groww API...');
    const response = await axios.get(GROWW_UPCOMING_IPO_URL, { headers: GROWW_HEADERS, timeout: 10000 });
    const rawList = response.data.ipoList || [];
    console.log(`✅ ${rawList.length} Upcoming IPOs from Groww.`);
    return rawList.map(formatUpcomingIpo);
  } catch (error) {
    console.warn(`⚠️ Failed to fetch Groww upcoming IPOs: ${error.message}`);
    return [];
  }
};

export const fetchGrowwLiveClosedIPOs = async () => {
  try {
    const response = await axios.get(GROWW_ALL_IPO_URL, { headers: GROWW_HEADERS, timeout: 10000 });
    const closedList = response.data?.ipoCompanyListingOrderMap?.CLOSED || [];
    return closedList.slice(0, 20).map(formatClosedIpo);
  } catch (error) {
    console.warn(`⚠️ Failed to fetch live Groww closed IPOs: ${error.message}`);
    return [];
  }
};

/** Fetch all IPOs (Open + Upcoming + Closed) for the bidding portal */
export const fetchAllGrowwBiddingIPOs = async () => {
  const [open, upcoming, closed] = await Promise.all([
    fetchGrowwLiveOpenIPOs(),
    fetchGrowwUpcomingIPOs(),
    fetchGrowwLiveClosedIPOs()
  ]);

  const openList = open || [];
  const all = [...openList, ...upcoming, ...closed];

  // Deduplicate by symbol, prefer OPEN > UPCOMING > CLOSED
  const statusPriority = { OPEN: 3, UPCOMING: 2, CLOSED: 1 };
  const seen = new Map();
  for (const ipo of all) {
    const key = ipo.symbol?.toLowerCase();
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing || statusPriority[ipo.biddingStatus] > statusPriority[existing.biddingStatus]) {
      seen.set(key, ipo);
    }
  }

  return Array.from(seen.values());
};
