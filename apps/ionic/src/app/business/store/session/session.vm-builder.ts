import { Session } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';

export interface SessionsVm {
  sessions: Session[];
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Creates a view model for the session picker in the business filter.
 * @param sessionsRequestState Request state holding the sessions and status
 * @returns View model with the sessions and computed UI state
 */
export function createSessionsVm(
  sessionsRequestState: RequestState<Session[]>
): SessionsVm {
  const sessions = sessionsRequestState.data ?? [];
  return {
    sessions,
    isLoading: sessionsRequestState.loading && sessions.length === 0,
    hasError: !!sessionsRequestState.error
  };
}
