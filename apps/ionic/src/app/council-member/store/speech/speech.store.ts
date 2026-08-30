import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, forkJoin, pipe, tap } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
import { TranscriptService } from '../../../shared/services/transcript.service';
import {
  cleanTranscriptText,
  groupSpeechesByBusiness,
  SpeechVm,
  toSpeeches,
  withSubjectTitles
} from '../../../shared/models/transcript.model';

/** How many speeches a page holds. */
export const SPEECH_PAGE_SIZE = 20;

export type SpeechSlice = {
  speechesRequestState: RequestState<SpeechVm[]>;
  /** The member whose speeches are loaded, so a revisit does not refetch. */
  personNumber: number | null;
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
    const transcriptService = inject(TranscriptService);

    /**
     * Fetch one page and label it with the businesses it was about. The titles
     * come from a second collection, so both land together and the list never
     * renders a page of untitled rows first.
     */
    const _fetchPage = rxMethod<{ personNumber: number; skip: number }>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            speechesRequestState: onRequestLoad(state.speechesRequestState)
          }))
        ),
        switchMap(({ personNumber, skip }) =>
          transcriptService
            .getSpeechesByMember(personNumber, SPEECH_PAGE_SIZE, skip)
            .pipe(
              map((transcripts) => toSpeeches(transcripts)),
              switchMap((speeches) =>
                forkJoin({
                  speeches: [speeches],
                  titles: transcriptService.getSubjectTitles(
                    speeches.map((speech) => speech.subjectId)
                  )
                })
              ),
              map(({ speeches, titles }) =>
                withSubjectTitles(speeches, titles)
              ),
              tapResponse({
                next: (page) =>
                  patchState(store, (state) => ({
                    speechesRequestState: onRequestSuccess(
                      state.speechesRequestState,
                      skip === 0
                        ? page
                        : [...(state.speechesRequestState.data ?? []), ...page]
                    ),
                    hasMore: page.length === SPEECH_PAGE_SIZE
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
          transcriptService.getSpeechText(id).pipe(
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
      /**
       * Load a member's first page, unless it is already on screen.
       * @param personNumber The member being viewed
       */
      selectMember(personNumber: number) {
        if (store.personNumber() === personNumber) return;

        patchState(store, {
          ...initialSpeechState,
          personNumber
        });
        _fetchPage({ personNumber, skip: 0 });
      },

      /** Append the next page, if the last one came back full. */
      loadMore() {
        const personNumber = store.personNumber();
        if (personNumber === null || !store.hasMore()) return;
        if (store.speechesRequestState().loading) return;

        _fetchPage({ personNumber, skip: store.speeches().length });
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
        _fetchPage({ personNumber, skip: 0 });
      }
    };
  })
);
