import { MemberCouncil } from 'swissparl';

export interface CouncilMemberListVm {
  councilMembers: MemberCouncil[];
  isRefreshing: boolean;
  noContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
}

export interface CouncilMemberDetailVm {
  councilMember: MemberCouncil | null;
  isLoading: boolean;
  hasError: boolean;
}
