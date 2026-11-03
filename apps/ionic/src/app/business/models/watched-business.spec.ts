import { ParliamentKey } from '@parlwatch/shared/parliament/models';
import { groupFollows, WatchedBusiness } from './watched-business';

function entry(
  parliament: ParliamentKey,
  id: number,
  finishedAt?: string
): WatchedBusiness {
  return {
    parliament,
    id,
    title: String(id),
    shortNumber: '',
    typeName: '',
    followedAt: 0,
    modified: '',
    snapshot: {
      modified: '',
      status: '',
      steps: [],
      votes: [],
      documents: [],
      speeches: 0
    },
    changes: [],
    unseen: false,
    ...(finishedAt ? { finishedAt } : {})
  };
}

const ids = (entries: WatchedBusiness[]) =>
  entries.map((e) => `${e.parliament}-${e.id}`);

describe('groupFollows', () => {
  it('splits open federal and cantonal follows and keeps their order', () => {
    const groups = groupFollows([
      entry('ZH', 1),
      entry('ch', 2),
      entry('BE', 3),
      entry('ch', 4)
    ]);

    expect(ids(groups.federal)).toEqual(['ch-2', 'ch-4']);
    expect(ids(groups.cantonal)).toEqual(['ZH-1', 'BE-3']);
    expect(groups.finished).toEqual([]);
  });

  it('puts finished follows of either level last, most recently finished first', () => {
    const groups = groupFollows([
      entry('ch', 1, '/Date(1000)/'),
      entry('ch', 2),
      entry('ZH', 3, '/Date(3000)/'),
      entry('ZH', 4),
      entry('ch', 5, '/Date(2000)/')
    ]);

    expect(ids(groups.federal)).toEqual(['ch-2']);
    expect(ids(groups.cantonal)).toEqual(['ZH-4']);
    expect(ids(groups.finished)).toEqual(['ZH-3', 'ch-5', 'ch-1']);
  });

  it('is empty without follows', () => {
    expect(groupFollows([])).toEqual({
      federal: [],
      cantonal: [],
      finished: []
    });
  });
});
