import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  onRequestError,
  onRequestLoad,
  onRequestSuccess,
  RequestState
} from '../../../shared/models/request-state.model';
import {
  cleanTranscriptText,
  groupSpeechesByBusiness,
  SpeechVm
} from '../../../shared/models/transcript.model';
import {
  FEDERAL_PARLIAMENT_KEY,
  ParliamentKey
} from '../../../shared/parliament/models/parliament.model';
import { CouncilMemberFacade } from '../../services/council-member.facade';

/** How many speeches a page holds. */
export const SPEECH_PAGE_SIZE = 20;

export type SpeechSlice = {
  speechesRequestState: RequestState<SpeechVm[]>;
  /** The member whose speeches are loaded, so a revisit does not refetch. */
  personNumber: number | null;
  parliament: ParliamentKey;
  /** Whether the last page came back full, i.e. more may follow. */
  hasMore: boolean;
  /** Bodies of the speeches a reader has opened, keyed by transcript id. */
  texts: Record<number, string>;
  /** The speech whose body is being fetched right now. */
  loadingTextId: number | null;
};

const initialSpeechState: SpeechSlice = {
  speechesRequestState: createDefaultRequestState<SpeechVm[]>([]),
  personNumber: null,
  parliament: FEDERAL_PARLIAMENT_KEY,
  hasMore: false,
  texts: {},
  loadingTextId: null
};

export const SpeechStore = signalStore(
  { providedIn: 'root' },
  withDevtools('SpeechStore'),
  withState(initialSpeechState),
  withComputed((store) => {
    return {
      speeches: computed(() => store.speechesRequestState().data ?? []),
      speechGroups: computed(() =>
        groupSpeechesByBusiness(store.speechesRequestState().data ?? [])
      ),
      isLoading: computed(
        () =>
          store.speechesRequestState().loading &&
          (store.speechesRequestState().data ?? []).length === 0
      ),
      isLoadingMore: computed(
        () =>
          store.speechesRequestState().loading &&
          (store.speechesRequestState().data ?? []).length > 0
      ),
      hasError: computed(() => !!store.speechesRequestState().error)
    };
  }),
  withMethods((store) => {
    const councilMemberFacade = inject(CouncilMemberFacade);

    const _fetchPage = rxMethod<{
      parliament: ParliamentKey;
      personNumber: number;
      skip: number;
    }>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            speechesRequestState: onRequestLoad(state.speechesRequestState)
          }))
        ),
        switchMap(({ parliament, personNumber, skip }) =>
          councilMemberFacade
            .getSpeechPage(parliament, personNumber, SPEECH_PAGE_SIZE, skip)
            .pipe(
              tapResponse({
                next: (page) =>
                  patchState(store, (state) => ({
                    speechesRequestState: onRequestSuccess(
                      state.speechesRequestState,
                      skip === 0
                        ? page.speeches
                        : [
                            ...(state.speechesRequestState.data ?? []),
                            ...page.speeches
                          ]
                    ),
                    texts: { ...state.texts, ...page.texts },
                    hasMore: page.hasMore
                  })),
                error: () =>
                  patchState(store, (state) => ({
                    speechesRequestState: onRequestError(
                      state.speechesRequestState
                    )
                  }))
              })
            )
        )
      )
    );

    const _fetchText = rxMethod<number>(
      pipe(
        filter((id) => store.texts()[id] === undefined),
        tap((id) => patchState(store, { loadingTextId: id })),
        switchMap((id) =>
          councilMemberFacade.getSpeechText(store.parliament(), id).pipe(
            tapResponse({
              next: (text) =>
                patchState(store, (state) => ({
                  texts: { ...state.texts, [id]: cleanTranscriptText(text) },
                  loadingTextId: null
                })),
              error: () => patchState(store, { loadingTextId: null })
            })
          )
        )
      )
    );

    return {
      selectMember(parliament: ParliamentKey, personNumber: number) {
        if (
          store.personNumber() === personNumber &&
          store.parliament() === parliament
        ) {
          return;
        }

        patchState(store, {
          ...initialSpeechState,
          parliament,
          personNumber
        });
        _fetchPage({ parliament, personNumber, skip: 0 });
      },

      /** Append the next page, if the last one came back full. */
      loadMore() {
        const personNumber = store.personNumber();
        if (personNumber === null || !store.hasMore()) return;
        if (store.speechesRequestState().loading) return;

        _fetchPage({
          parliament: store.parliament(),
          personNumber,
          skip: store.speeches().length
        });
      },

      /**
       * Fetch a speech's body, which the list does not carry.
       * @param id The transcript to read
       */
      loadText(id: number) {
        _fetchText(id);
      },

      retry() {
        const personNumber = store.personNumber();
        if (personNumber === null) return;
        _fetchPage({ parliament: store.parliament(), personNumber, skip: 0 });
      }
    };
  })
);
