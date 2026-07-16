import * as kfintechService from './kfintechService.js';
import * as bigshareService from './bigshareService.js';
import * as mufgService from './mufgService.js';

const mergeRegistrarDetails = (detailsList) => {
  const merged = new Map();
  for (const item of detailsList) {
    for (const detail of item.allRegistrarsDetails || []) {
      const existing = merged.get(detail.registrar);
      if (!existing) {
        merged.set(detail.registrar, { ...detail });
      } else {
        existing.checkedCount += detail.checkedCount;
        if (detail.status === 'Success') existing.status = 'Success';
      }
    }
  }
  return [...merged.values()];
};

export const queryAllIPOs = async (ipos, searchType, searchValue) => {
  const kfintechIpos = ipos.filter((ipo) => ipo.registrar === 'KFintech');
  const bigshareIpos = ipos.filter((ipo) => ipo.registrar === 'Bigshare');
  const mufgIpos = ipos.filter((ipo) => ipo.registrar === 'MUFG');

  const tasks = [];
  if (kfintechIpos.length) tasks.push(kfintechService.queryAllIPOs(kfintechIpos, searchType, searchValue));
  if (bigshareIpos.length) tasks.push(bigshareService.queryAllIPOs(bigshareIpos, searchType, searchValue));
  if (mufgIpos.length) tasks.push(mufgService.queryAllIPOs(mufgIpos, searchType, searchValue));

  if (!tasks.length) {
    return { success: false, allRegistrarsDetails: [], results: [] };
  }

  const outcomes = await Promise.all(tasks);
  return {
    success: outcomes.some((o) => o.success),
    allRegistrarsDetails: mergeRegistrarDetails(outcomes),
    results: outcomes.flatMap((o) => o.results)
  };
};

export const queryBulkIPOs = async (ipo, searchType, values) => {
  if (ipo.registrar === 'Bigshare') {
    return bigshareService.queryBulkIPOs(ipo, searchType, values);
  }
  if (ipo.registrar === 'KFintech') {
    return kfintechService.queryBulkIPOs(ipo, searchType, values);
  }
  if (ipo.registrar === 'MUFG') {
    return mufgService.queryBulkIPOs(ipo, searchType, values);
  }
  throw new Error(`Bulk allotment is not supported for registrar: ${ipo.registrar}`);
};
