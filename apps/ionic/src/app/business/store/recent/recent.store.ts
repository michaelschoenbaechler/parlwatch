import { createRecentStore } from '@parlwatch/shared/common/store';

/** Recently viewed businesses and recent business search terms. */
export const RecentBusinessStore = createRecentStore({
  name: 'RecentBusinessStore',
  entriesKey: 'business.recentBusinesses',
  searchesKey: 'business.recentSearches'
});
