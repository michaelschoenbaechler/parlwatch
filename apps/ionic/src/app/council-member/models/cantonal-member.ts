import { MemberCouncil } from 'swissparl';
import { CantonKey } from '../../shared/parliament/models/parliament.model';
import { RecordSource } from '../../shared/open-parl-data/models/record-source';
import { SpeechGroupVm } from '../../shared/models/transcript.model';
import { InterestGroupVm } from './person-interest';

export interface MemberMembership {
  key: string;
  group: string;
  role: string;
  since: string;
}

export interface CantonalMemberDetail {
  parliament: CantonKey;
  imageUrl: string;
  electoralDistrict: string;
  occupation: string;
  fraktion: MemberMembership[];
  commissions: MemberMembership[];
  interests: InterestGroupVm[];
  source: RecordSource;
}

export interface LoadedMember extends MemberCouncil {
  cantonal?: CantonalMemberDetail;
}

export interface MemberVoteRecord {
  votingId: number;
  title: string;
  businessNumber: number | null;
  decision: number;
  date: string;
}

export interface MemberSpeeches {
  groups: SpeechGroupVm[];
  texts: Record<number, string>;
}
