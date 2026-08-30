import { InterestGroupVm } from '../../models/person-interest';

export interface InterestVm {
  /** The member's register entries, grouped by legal form. */
  groups: InterestGroupVm[];
  hasNoInterests: boolean;
  isLoading: boolean;
  hasError: boolean;
}
