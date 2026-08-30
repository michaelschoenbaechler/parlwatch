import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubjectBusiness, Transcript } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import {
  SubjectTitle,
  TRANSCRIPT_TYPE_SPEECH
} from '../models/transcript.model';
import { SwissParlService } from './swissparl.service';

/**
 * Everything the speech list shows. `Text` is deliberately absent: it averages
 * 8.5 KB against roughly 630 bytes for the rest of the row, so a page of
 * twenty speeches costs ~13 KB instead of ~170 KB.
 */
const LIST_FIELDS: Array<keyof Transcript> = [
  'ID',
  'IdSubject',
  'PersonNumber',
  'CouncilName',
  'SpeakerFullName',
  'SpeakerFunction',
  'ParlGroupAbbreviation',
  'LanguageOfText',
  'SortOrder',
  'Start',
  'End',
  'Type'
];

/**
 * Shortest body that counts as a speech.
 *
 * Every transcript carries text, but a member presiding over the session gets
 * one row per interjection — "Bonjour", "Angenommen - Adopté" — which is not
 * something a reader wants listed. Measured across the collection, speeches
 * given as a member run to a median of ~2600 characters and never fall below
 * 100, while presiding entries sit at a median of ~300, so this cuts the
 * procedural chatter without hiding real contributions.
 */
const MIN_SPEECH_LENGTH = 300;

@Injectable({
  providedIn: 'root'
})
export class TranscriptService {
  private readonly swissParlService = inject(SwissParlService);
  private readonly translocoService = inject(TranslocoService);

  /**
   * A member's speeches, newest first, without their bodies.
   * @param personNumber The member's `PersonNumber`
   * @param top How many speeches to fetch
   * @param skip How many to skip, for paging
   * @returns Speech metadata rows
   */
  getSpeechesByMember(
    personNumber: number,
    top: number,
    skip = 0
  ): Observable<Transcript[]> {
    // Typed loosely so the raw `length()` expression can ride along as a key,
    // the same escape hatch the business tag filter uses.
    const filter: { eq: Record<string, string | number | boolean>[] } = {
      eq: [
        {
          PersonNumber: personNumber,
          Language: this.translocoService.getActiveLang().toUpperCase(),
          // Excludes vote announcements and ceremonial items, neither of
          // which is the member speaking.
          Type: TRANSCRIPT_TYPE_SPEECH
        },
        { [`(length(Text) gt ${MIN_SPEECH_LENGTH})`]: true }
      ]
    };

    return this.swissParlService.fetchCollection<Transcript>('Transcript', {
      top,
      skip,
      select: LIST_FIELDS,
      filter,
      orderby: { property: 'Start', order: 'desc' }
    });
  }

  /**
   * The agenda items a business was debated under.
   *
   * Parliament splits a business over several items — first chamber, second
   * chamber, differences — and a transcript names only its item, so this is
   * the hop from a business to its debate.
   * @param businessNumber The business's id
   * @returns The agenda items, carrying their stage notes
   */
  getBusinessSubjects(businessNumber: number): Observable<SubjectBusiness[]> {
    return this.swissParlService.fetchCollection<SubjectBusiness>(
      'SubjectBusiness',
      {
        top: 50,
        select: ['IdSubject', 'PublishedNotes', 'BusinessShortNumber'],
        filter: {
          eq: [
            {
              BusinessNumber: businessNumber,
              Language: this.translocoService.getActiveLang().toUpperCase()
            }
          ]
        }
      }
    );
  }

  /**
   * Every speech given under a set of agenda items.
   *
   * Ordering is left to the caller: `SortOrder` restarts at one in each item,
   * so a single `$orderby` cannot sequence a debate that spans several.
   * @param subjectIds Agenda item ids of the debate
   * @param top Ceiling on the number of speeches
   * @returns Speech metadata rows, without their bodies
   */
  getSpeechesBySubjects(
    subjectIds: number[],
    top = 200
  ): Observable<Transcript[]> {
    const uniqueIds = [...new Set(subjectIds)].filter((id) => id > 0);
    if (uniqueIds.length === 0) return of([]);

    const filter: { eq: Record<string, string | number | boolean>[] } = {
      eq: [
        {
          Language: this.translocoService.getActiveLang().toUpperCase(),
          Type: TRANSCRIPT_TYPE_SPEECH
        },
        { [`(length(Text) gt ${MIN_SPEECH_LENGTH})`]: true },
        ...uniqueIds.map((id) => ({ IdSubject: id }))
      ]
    };

    return this.swissParlService.fetchCollection<Transcript>('Transcript', {
      top,
      select: LIST_FIELDS,
      filter
    });
  }

  /**
   * The body of a single speech, fetched only when a reader opens it.
   * @param id The transcript's id
   * @returns The speech body, or an empty string when the row has none
   */
  getSpeechText(id: number): Observable<string> {
    return this.swissParlService
      .fetchCollection<Transcript>('Transcript', {
        top: 1,
        select: ['ID', 'Text'],
        filter: {
          eq: [
            {
              ID: id,
              Language: this.translocoService.getActiveLang().toUpperCase()
            }
          ]
        }
      })
      .pipe(map((rows) => rows[0]?.Text ?? ''));
  }

  /**
   * Resolve the businesses behind a page of speeches, in one request.
   *
   * A transcript names only its agenda item, so without this a speech list
   * reads as a column of bare dates. Members often speak repeatedly on the
   * same item, hence the de-duplication.
   * @param subjectIds Agenda item ids from the loaded speeches
   * @returns Titles keyed by agenda item id
   */
  getSubjectTitles(
    subjectIds: number[]
  ): Observable<Record<number, SubjectTitle>> {
    const uniqueIds = [...new Set(subjectIds)].filter((id) => id > 0);
    if (uniqueIds.length === 0) return of({});

    return this.swissParlService
      .fetchCollection<SubjectBusiness>('SubjectBusiness', {
        top: uniqueIds.length,
        select: ['IdSubject', 'BusinessShortNumber', 'Title'],
        filter: {
          eq: [
            { Language: this.translocoService.getActiveLang().toUpperCase() },
            // Repeated keys are OR-ed by the query builder.
            ...uniqueIds.map((id) => ({ IdSubject: id }))
          ]
        }
      })
      .pipe(map(toTitleMap));
  }
}

/**
 * Index agenda items by id.
 * @param rows Rows from the `SubjectBusiness` collection
 * @returns Titles keyed by agenda item id
 */
function toTitleMap(rows: SubjectBusiness[]): Record<number, SubjectTitle> {
  const titles: Record<number, SubjectTitle> = {};

  for (const row of rows) {
    const id = Number(row.IdSubject ?? 0);
    if (!id) continue;

    titles[id] = {
      title: row.Title?.trim() ?? '',
      businessShortNumber: row.BusinessShortNumber?.trim() ?? ''
    };
  }

  return titles;
}
