import { Vote } from 'swissparl';
import { ParliamentKey } from '../../parliament/models/parliament.model';
import { RecordSource } from '../../parliament/models/record-source';
import { VoteTally } from './vote-decision';

export interface LoadedVote extends Vote {
  tally?: VoteTally;
  cantonal?: {
    parliament: ParliamentKey;
    source: RecordSource;
  };
}
