import { Business } from 'swissparl';
import { CantonKey } from '@parlwatch/shared/parliament/models';
import { RecordSource } from '@parlwatch/shared/open-parl-data/models';
import { SpeechGroupVm } from '@parlwatch/shared/common/models';
import { LoadedVote } from '../../votes/models/loaded-vote';
import { BusinessTextSection } from './business-text';
import { TimelineStep } from './business-timeline';

export interface BusinessContributor {
  key: string;
  name: string;
  role: string;
  party: string;
  personId: number | null;
}

export interface BusinessDocument {
  id: number;
  name: string;
  url: string;
  date: string;
}

export interface CantonalBusinessDetail {
  parliament: CantonKey;
  /** Status in the canton's own language, stable across UI language switches. */
  statusKey: string;
  contributors: BusinessContributor[];
  timeline: TimelineStep[];
  documents: BusinessDocument[];
  texts: BusinessTextSection[];
  speeches: SpeechGroupVm[];
  speechTexts: Record<number, string>;
  votes: LoadedVote[];
  source: RecordSource;
}

export interface LoadedBusiness extends Business {
  cantonal?: CantonalBusinessDetail;
}
