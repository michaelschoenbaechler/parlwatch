import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, tap } from 'rxjs';
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
  SpeechGroupVm,
  toDebateStages,
  toSpeeches,
  toStageLabel
} from '../../../shared/models/transcript.model';

export type DebateSlice = {
  stagesRequestState: RequestState<SpeechGroupVm[]>;
  /** The business whose debate is loaded, so a revisit does not refetch. */
  businessNumber: number | null;
  /** Bodies of the speeches a reader has opened, keyed by transcript id. */
  texts: Record<number, string>;
  /** The speech whose body is being fetched right now. */
  loadingTextId: number | null;
};

const initialDebateState: DebateSlice = {
  stagesRequestState: createDefaultRequestState<SpeechGroupVm[]>([]),
  businessNumber: null,
  texts: {},
  loadingTextId: null
};

export const DebateStore = signalStore(
  { providedIn: 'root' },
  withDevtools('DebateStore'),
  withState(initialDebateState),
  withComputed((store) => {
    return {
      stages: computed(() => store.stagesRequestState().data ?? []),
      isLoading: computed(() => store.stagesRequestState().loading),
      hasError: computed(() => !!store.stagesRequestState().error)
    };
  }),
  withMethods((store) => {
    const transcriptService = inject(TranscriptService);

    const _fetchDebate = rxMethod<number>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            stagesRequestState: onRequestLoad(state.stagesRequestState)
          }))
        ),
        switchMap((businessNumber) =>
          transcriptService.getBusinessSubjects(businessNumber).pipe(
            switchMap((subjects) => {
              // Stage names come from the agenda items, the speeches from the
              // transcripts under them, so both are needed before grouping.
              const labels: Record<number, string> = {};
              for (const subject of subjects) {
                const id = Number(subject.IdSubject ?? 0);
                if (id) labels[id] = toStageLabel(subject.PublishedNotes);
              }

              return transcriptService
                .getSpeechesBySubjects(Object.keys(labels).map(Number))
                .pipe(
                  map((transcripts) =>
                    toDebateStages(toSpeeches(transcripts), labels)
                  )
                );
            }),
            tapResponse({
              next: (stages) =>
                patchState(store, (state) => ({
                  stagesRequestState: onRequestSuccess(
                    state.stagesRequestState,
                    stages
                  )
                })),
              error: () =>
                patchState(store, (state) => ({
                  stagesRequestState: onRequestError(state.stagesRequestState)
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
       * Load a business's debate, unless it is already on screen.
       * @param businessNumber The business being viewed
       */
      selectBusiness(businessNumber: number) {
        if (store.businessNumber() === businessNumber) return;

        patchState(store, { ...initialDebateState, businessNumber });
        _fetchDebate(businessNumber);
      },

      /**
       * Fetch a speech's body, which the list does not carry.
       * @param id The transcript to read
       */
      loadText(id: number) {
        _fetchText(id);
      }
    };
  })
);
