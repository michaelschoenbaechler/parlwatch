import { Vote } from 'swissparl';
import { ParliamentKey } from '../../parliament/models/parliament.model';
import { RecordSource } from '../../parliament/models/record-source';
import { VoteTally } from './vote-decision';

/**
 * A vote as the list and detail pages receive it: the federal shape, plus
 * what a cantonal vote already knows about itself.
 */
export interface LoadedVote extends Vote {
  /**
   * The decision counts, when the record carries them. A cantonal voting
   * ships its totals inline, so the list never has to fetch ballots for it;
   * a federal vote leaves this unset and the store batches the ballots.
   */
  tally?: VoteTally;
  /** Set for cantonal votes, whose detail page shows where they came from. */
  cantonal?: {
    parliament: ParliamentKey;
    source: RecordSource;
  };
}
