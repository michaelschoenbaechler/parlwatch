import { PartialStateUpdater } from '@ngrx/signals';
import { PersonInterest } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { InterestSlice } from './interest.store';

/**
 * Marks the register request as loading.
 *
 * Clears the previous member's entries so the page cannot show one member's
 * interests under another member's name while the request is in flight.
 * @returns Partial updater setting the request to loading
 */
export function createLoadInterestRequestState(): PartialStateUpdater<InterestSlice> {
  return (state) => ({
    ...state,
    interestRequestState: {
      ...onRequestLoad(state.interestRequestState),
      data: []
    }
  });
}

/**
 * Stores a member's register entries and marks the request successful.
 * @param interests Entries as returned by the `PersonInterest` collection
 * @returns Partial updater setting the request to success
 */
export function createSuccessInterestRequestState(
  interests: PersonInterest[]
): PartialStateUpdater<InterestSlice> {
  return (state) => ({
    ...state,
    interestRequestState: onRequestSuccess(
      state.interestRequestState,
      interests
    )
  });
}

/**
 * Marks the register request as failed.
 * @returns Partial updater setting the request to error
 */
export function createErrorInterestRequestState(): PartialStateUpdater<InterestSlice> {
  return (state) => ({
    ...state,
    interestRequestState: onRequestError(state.interestRequestState)
  });
}
