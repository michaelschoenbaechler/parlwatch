import { Vote } from 'swissparl';
import { ParliamentKey } from '@parlwatch/shared/parliament/models';
import { RecordSource } from '@parlwatch/shared/open-parl-data/models';
import { VoteTally } from '@parlwatch/shared/common/models';

export interface LoadedVote extends Vote {
  tally?: VoteTally;
  cantonal?: {
    parliament: ParliamentKey;
    source: RecordSource;
  };
}
