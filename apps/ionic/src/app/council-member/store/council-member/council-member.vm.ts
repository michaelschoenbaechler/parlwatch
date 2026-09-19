import { MemberCouncil } from 'swissparl';
import { LoadedMember } from '../../models/cantonal-member';

export interface CouncilMemberListVm {
  councilMembers: MemberCouncil[];
  isRefreshing: boolean;
  noContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
}

export interface CouncilMemberDetailVm {
  councilMember: LoadedMember | null;
  isLoading: boolean;
  hasError: boolean;
}
