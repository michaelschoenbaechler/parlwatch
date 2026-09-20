import { Voting } from 'swissparl';
import {
  createDefaultRequestState,
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/common/models/request-state.model';
import { LoadedVote } from '../../models/loaded-vote';
import {
  createVoteDetailVm,
  createVoteListVm,
  groupVotesByBusiness
} from './vote.vm-builder';

const vote = (overrides: Partial<LoadedVote>): LoadedVote =>
  ({ ID: 1, VoteEnd: '/Date(1000)/', ...overrides }) as LoadedVote;

describe('vote view models', () => {
  describe('groupVotesByBusiness', () => {
    it('groups by business and orders groups and votes newest first', () => {
      const groups = groupVotesByBusiness([
        vote({
          ID: 1,
          BusinessNumber: 10,
          BusinessShortNumber: '26.010',
          VoteEnd: '/Date(1000)/'
        }),
        vote({
          ID: 2,
          BusinessNumber: 20,
          BusinessShortNumber: '26.020',
          VoteEnd: '/Date(3000)/'
        }),
        vote({
          ID: 3,
          BusinessNumber: 10,
          BusinessShortNumber: '26.010',
          VoteEnd: '/Date(2000)/'
        })
      ]);

      expect(groups.map((group) => group.key)).toEqual(['20', '10']);
      expect(groups[1].votes.map((v) => v.ID)).toEqual([3, 1]);
      expect(groups[1].latestVoteEnd).toBe('/Date(2000)/');
      expect(groups[0].businessShortNumber).toBe('26.020');
    });

    it('falls back to the short number, then the vote itself, as the key', () => {
      const groups = groupVotesByBusiness([
        vote({ ID: 5, BusinessShortNumber: '26.005', VoteEnd: undefined }),
        vote({ ID: 6, BusinessShortNumber: undefined, VoteEnd: 'garbage' })
      ]);

      expect(groups.map((group) => group.key)).toEqual(['26.005', 'vote-6']);
      expect(groups[1].businessNumber).toBeNull();
      expect(groups[1].businessTitle).toBe('');
    });
  });

  describe('createVoteListVm', () => {
    const query = { parliament: 'ch' as const, top: 10, skip: 0 };

    it('reports the initial load, a refresh and loading more apart', () => {
      const empty = onRequestLoad(createDefaultRequestState<LoadedVote[]>([]));
      expect(createVoteListVm(empty, query).isLoading).toBeTrue();
      expect(createVoteListVm(empty, query).noContent).toBeTrue();

      const refreshing = onRequestLoad(
        createDefaultRequestState<LoadedVote[]>([vote({})])
      );
      expect(createVoteListVm(refreshing, query).isRefreshing).toBeTrue();
      expect(createVoteListVm(refreshing, query).isLoading).toBeFalse();

      const more = createVoteListVm(refreshing, { ...query, skip: 10 });
      expect(more.isLoadingMore).toBeTrue();
      expect(more.isRefreshing).toBeFalse();
    });

    it('surfaces an error and never reports a federal list as unpublished', () => {
      const failed = onRequestError(
        createDefaultRequestState<LoadedVote[]>([])
      );
      const vm = createVoteListVm(failed, query);
      expect(vm.hasError).toBeTrue();
      expect(vm.noVotingsPublished).toBeFalse();

      const missingData = createVoteListVm(
        { ...failed, data: undefined },
        query
      );
      expect(missingData.businessGroups).toEqual([]);
    });
  });

  describe('createVoteDetailVm', () => {
    const ballots = [
      { Decision: 1, ParlGroupCode: 'S' },
      { Decision: 2, ParlGroupCode: 'V' },
      { Decision: 3 }
    ] as Voting[];
    const loaded = onRequestSuccess(
      createDefaultRequestState<LoadedVote | null>(null),
      vote({ Votings: ballots })
    );

    it('shows every ballot or only one decision', () => {
      expect(createVoteDetailVm(loaded, 'all').votings.length).toBe(3);
      expect(createVoteDetailVm(loaded, 'no').votings.length).toBe(1);
      expect(createVoteDetailVm(loaded, 'yes').parlGroups.length).toBe(3);
    });

    it('is loading only while nothing is on screen', () => {
      const loading = onRequestLoad(
        createDefaultRequestState<LoadedVote | null>(null)
      );
      expect(createVoteDetailVm(loading, 'all').isLoading).toBeTrue();
      expect(createVoteDetailVm(loading, 'all').votings).toEqual([]);

      const reloading = { ...onRequestLoad(loaded), data: loaded.data };
      expect(createVoteDetailVm(reloading, 'all').isLoading).toBeFalse();

      const withoutBallots = onRequestSuccess(
        createDefaultRequestState<LoadedVote | null>(null),
        vote({ Votings: undefined })
      );
      expect(createVoteDetailVm(withoutBallots, 'all').votings).toEqual([]);
      expect(
        createVoteDetailVm(onRequestError(loaded), 'all').hasError
      ).toBeTrue();
    });
  });
});
