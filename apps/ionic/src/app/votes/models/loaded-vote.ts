import { Vote } from 'swissparl';
import { ParliamentKey } from '@parlwatch/shared/parliament/models/parliament.model';
import { RecordSource } from '@parlwatch/shared/open-parl-data/models/record-source';
import { VoteTally } from '@parlwatch/shared/common/models/vote-decision';

export interface LoadedVote extends Vote {
  tally?: VoteTally;
  cantonal?: {
    parliament: ParliamentKey;
    source: RecordSource;
  };
}
