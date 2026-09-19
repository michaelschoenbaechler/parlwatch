import { Business } from 'swissparl';
import { CantonKey } from '../../parliament/models/parliament.model';
import { RecordSource } from '../../parliament/models/record-source';
import { SpeechGroupVm } from '../../shared/models/transcript.model';
import { LoadedVote } from '../../votes/models/loaded-vote';
import { BusinessTextSection } from './business-text';
import { TimelineStep } from './business-timeline';

/** Someone who submitted or is responsible for a cantonal business. */
export interface BusinessContributor {
  /** Stable identity for `@for` tracking. */
  key: string;
  name: string;
  /** Harmonised role, e.g. "Urheber/in" or "Federführendes Departement". */
  role: string;
  /** Native party label, empty for departments and committees. */
  party: string;
  /** Person id when the contributor is a member with a detail page. */
  personId: number | null;
}

/** A document attached to a cantonal business, opened in the system browser. */
export interface BusinessDocument {
  id: number;
  name: string;
  url: string;
  /** OData date the document is dated with, empty when unknown. */
  date: string;
}

/**
 * What a cantonal business carries beyond the federal card fields. Built once
 * by the cantonal service so the detail page only renders.
 */
export interface CantonalBusinessDetail {
  parliament: CantonKey;
  contributors: BusinessContributor[];
  timeline: TimelineStep[];
  documents: BusinessDocument[];
  /** The business text, where the canton publishes one. */
  texts: BusinessTextSection[];
  /** Speeches with a published transcript, grouped for the speech list. */
  speeches: SpeechGroupVm[];
  /** Speech bodies keyed by speech id; cantonal speeches ship inline. */
  speechTexts: Record<number, string>;
  votes: LoadedVote[];
  source: RecordSource;
}

/**
 * A business as the detail page receives it: the federal shape, plus the
 * cantonal sections when it came from a canton.
 */
export interface LoadedBusiness extends Business {
  cantonal?: CantonalBusinessDetail;
}
