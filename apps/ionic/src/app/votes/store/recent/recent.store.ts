import { createRecentStore } from '../../../shared/store/recent/recent.store';

/** Recently viewed votes and recent vote search terms. */
export const RecentVoteStore = createRecentStore({
  name: 'RecentVoteStore',
  entriesKey: 'votes.recentVotes',
  searchesKey: 'votes.recentSearches'
});
