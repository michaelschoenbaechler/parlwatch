import { Vote } from 'swissparl';
import { ParliamentKey } from '../../shared/parliament/models/parliament.model';
import { RecordSource } from '../../shared/open-parl-data/models/record-source';
import { VoteTally } from '../../shared/models/vote-decision';

export interface LoadedVote extends Vote {
  tally?: VoteTally;
  cantonal?: {
    parliament: ParliamentKey;
    source: RecordSource;
  };
}
