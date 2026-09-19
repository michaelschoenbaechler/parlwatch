import { MemberCouncil } from 'swissparl';
import { CantonKey } from '../../parliament/models/parliament.model';
import { RecordSource } from '../../parliament/models/record-source';
import { SpeechGroupVm } from '../../shared/models/transcript.model';
import { InterestGroupVm } from './person-interest';

/** One seat a member holds in a fraktion or commission. */
export interface MemberMembership {
  /** Stable identity for `@for` tracking. */
  key: string;
  group: string;
  /** Role in the group, e.g. "Präsidentin"; empty for a plain member. */
  role: string;
  /** OData date the seat was taken, empty when unknown. */
  since: string;
}

/**
 * What a cantonal member carries beyond the federal ID-card fields. Built by
 * the cantonal service so the detail page only renders; every list is empty
 * when the canton does not publish it, and the page then omits the section.
 */
export interface CantonalMemberDetail {
  parliament: CantonKey;
  /** Portrait, where the canton publishes one. */
  imageUrl: string;
  electoralDistrict: string;
  occupation: string;
  fraktion: MemberMembership[];
  commissions: MemberMembership[];
  interests: InterestGroupVm[];
  source: RecordSource;
}

/**
 * A member as the pages receive it: the federal shape, plus the cantonal
 * sections when the member sits in a canton.
 */
export interface LoadedMember extends MemberCouncil {
  cantonal?: CantonalMemberDetail;
}

/** One entry of a cantonal member's voting record. */
export interface MemberVoteRecord {
  votingId: number;
  title: string;
  businessNumber: number | null;
  /** Federal decision code, so the existing icons and colours apply. */
  decision: number;
  /** OData date of the vote. */
  date: string;
}

/** A cantonal member's speeches, ready for the speech list. */
export interface MemberSpeeches {
  groups: SpeechGroupVm[];
  texts: Record<number, string>;
}
