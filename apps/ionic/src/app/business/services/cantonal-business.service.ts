import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Business, BusinessType } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '../../parliament/services/open-parl-data.service';
import {
  languageQuery,
  searchQuery,
  localized,
  relationList,
  singleRecord,
  toODataDate
} from '../../parliament/models/open-parl-data.model';
import {
  OpdAffair,
  OpdContributor,
  OpdDoc,
  OpdEvent,
  OpdSpeech,
  OpdText,
  OpdTypeGroup,
  OpdVoting
} from '../../parliament/models/open-parl-data.records';
import { CantonKey } from '../../parliament/models/parliament.model';
import {
  cleanTranscriptText,
  SpeechGroupVm,
  SpeechVm
} from '../../shared/models/transcript.model';
import { odataTimestamp } from '../../shared/models/odata.model';
import { toLoadedVote } from '../../votes/models/cantonal-vote';
import {
  BusinessContributor,
  BusinessDocument,
  LoadedBusiness
} from '../models/cantonal-business';
import { BusinessTextSection, toTextSection } from '../models/business-text';
import { TimelineStep } from '../models/business-timeline';
import { BusinessFilter } from './business.service';

const LIST_FIELDS = [
  'id',
  'number',
  'title',
  'type_name',
  'state_name',
  'begin_date'
].join(',');

const DETAIL_FIELDS = [
  'id',
  'body_key',
  'number',
  'title',
  'type_name',
  'state_name',
  'begin_date',
  'updated_at',
  'url_external',
  'contributors.id',
  'contributors.person_id',
  'contributors.type',
  'contributors.fullname',
  'contributors.role_harmonized',
  'contributors.role',
  'contributors.party',
  'contributors.position',
  'events.id',
  'events.date',
  'events.position',
  'events.title',
  'events.title_harmonized',
  'events.title_harmonized_id',
  'events.actor',
  'docs.id',
  'docs.name',
  'docs.url',
  'docs.url_oparl',
  'docs.date',
  'texts.id',
  'texts.title',
  'texts.text',
  'texts.position',
  'speeches.id',
  'speeches.person_id',
  'speeches.text_content',
  'votings.id',
  'votings.affair_id',
  'votings.date',
  'votings.title',
  'votings.affair_title',
  'votings.results_yes',
  'votings.results_no',
  'votings.results_abstention',
  'votings.results_absent',
  'votings.updated_at',
  'votings.updated_external_at',
  'votings.url_external'
].join(',');

const DETAIL_EXPAND = 'contributors,events,docs,texts,speeches,votings';

const SPEECH_FIELDS = [
  'id',
  'person_id',
  'date_start',
  'person_role',
  'text_content',
  'person.fullname',
  'person.party'
].join(',');

const MAX_SPEECHES = 200;

const EVENT_SUBMITTED = 1;

@Injectable({
  providedIn: 'root'
})
export class CantonalBusinessService {
  private readonly openParlData = inject(OpenParlDataService);
  private readonly translocoService = inject(TranslocoService);

  getBusinesses(filter: BusinessFilter): Observable<Business[]> {
    const { parliament, top, skip, searchTerm, businessTypes } = filter;
    const lang = this.translocoService.getActiveLang();
    const typeIds = (businessTypes ?? [])
      .map((type) => type.ID)
      .filter((id): id is number => id !== undefined);

    return this.openParlData
      .fetch<OpdAffair>('affairs', {
        body_key: parliament,
        sort_by: '-begin_date',
        offset: skip ?? 0,
        limit: top,
        fields: LIST_FIELDS,
        type_harmonized_id: typeIds.length ? typeIds.join(',') : undefined,
        ...searchQuery(searchTerm, 'metadata,docs'),
        ...languageQuery(lang)
      })
      .pipe(map((page) => page.data.map((affair) => toBusiness(affair, lang))));
  }

  getBusinessTypes(parliament: CantonKey): Observable<BusinessType[]> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdTypeGroup>('affairs/group_by/types_harmonized', {
        body_key: parliament,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toBusinessTypes(page.data, lang)));
  }

  getBusiness(parliament: CantonKey, id: number): Observable<LoadedBusiness> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdAffair>(`affairs/${id}`, {
        expand: DETAIL_EXPAND,
        fields: DETAIL_FIELDS,
        ...languageQuery(lang)
      })
      .pipe(
        switchMap((page) => {
          const affair = singleRecord(page.data);
          const hasTranscripts = relationList(affair.speeches).some(
            (speech) =>
              !!speech.person_id && !!localized(speech.text_content, lang)
          );

          return (
            hasTranscripts ? this.getSpeeches(id, lang) : of([] as OpdSpeech[])
          ).pipe(
            map((speeches) =>
              toLoadedBusiness(affair, speeches, parliament, lang)
            )
          );
        })
      );
  }

  private getSpeeches(affairId: number, lang: string): Observable<OpdSpeech[]> {
    return this.openParlData
      .fetch<OpdSpeech>('speeches', {
        affair_id: affairId,
        exclude_null: 'person_id',
        expand: 'person',
        fields: SPEECH_FIELDS,
        sort_by: 'date_start',
        limit: MAX_SPEECHES,
        ...languageQuery(lang)
      })
      .pipe(map((page) => page.data));
  }
}

export function toBusiness(affair: OpdAffair, lang: string): Business {
  return {
    ID: affair.id,
    BusinessShortNumber: affair.number?.trim() ?? '',
    BusinessTypeName: localized(affair.type_name, lang),
    BusinessStatusText: localized(affair.state_name, lang),
    BusinessStatusDate: undefined,
    SubmissionDate: toODataDate(affair.begin_date),
    Title: localized(affair.title, lang),
    TagNames: ''
  } as Business;
}

export function toBusinessTypes(
  groups: OpdTypeGroup[],
  lang: string
): BusinessType[] {
  return groups
    .map((group) => ({
      ID: group.type_harmonized_id ?? undefined,
      BusinessTypeName: localized(group.type_harmonized, lang)
    }))
    .filter(
      (type): type is BusinessType & { ID: number; BusinessTypeName: string } =>
        type.ID !== undefined && !!type.BusinessTypeName
    )
    .sort((a, b) => a.BusinessTypeName.localeCompare(b.BusinessTypeName));
}

export function toLoadedBusiness(
  affair: OpdAffair,
  speeches: OpdSpeech[],
  parliament: CantonKey,
  lang: string
): LoadedBusiness {
  return {
    ...toBusiness(affair, lang),
    cantonal: {
      parliament,
      contributors: toContributors(relationList(affair.contributors), lang),
      timeline: toTimeline(relationList(affair.events), lang),
      documents: toDocuments(relationList(affair.docs)),
      texts: toTextSections(relationList(affair.texts), lang),
      speeches: toSpeechGroups(speeches, lang),
      speechTexts: toSpeechTexts(speeches, lang),
      votes: relationList<OpdVoting>(affair.votings)
        .map((voting) => toLoadedVote(voting, parliament, lang))
        .sort((a, b) => odataTimestamp(b.VoteEnd) - odataTimestamp(a.VoteEnd)),
      source: {
        updatedAt: toODataDate(affair.updated_at),
        url: localized(affair.url_external, lang)
      }
    }
  };
}

function toContributors(
  contributors: OpdContributor[],
  lang: string
): BusinessContributor[] {
  return [...contributors]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .filter((contributor) => !!contributor.fullname?.trim())
    .map((contributor, index) => ({
      key: `contributor-${contributor.id ?? index}`,
      name: contributor.fullname?.trim() ?? '',
      role:
        localized(contributor.role_harmonized, lang) ||
        localized(contributor.role, lang),
      party: localized(contributor.party, lang),
      personId:
        contributor.type === 'person' && contributor.person_id
          ? contributor.person_id
          : null
    }));
}

function toTimeline(events: OpdEvent[], lang: string): TimelineStep[] {
  return [...events]
    .filter((event) => !!event.date)
    .sort(
      (a, b) =>
        Date.parse(a.date ?? '') - Date.parse(b.date ?? '') ||
        (a.position ?? 0) - (b.position ?? 0)
    )
    .map((event, index) => {
      const isSubmission =
        index === 0 && event.title_harmonized_id === EVENT_SUBMITTED;

      return {
        key: `event-${event.id ?? index}`,
        date: toODataDate(event.date),
        council: localized(event.actor, lang),
        text: isSubmission
          ? ''
          : localized(event.title_harmonized, lang) ||
            localized(event.title, lang),
        kind: isSubmission ? 'submission' : 'status'
      };
    });
}

function toDocuments(docs: OpdDoc[]): BusinessDocument[] {
  return docs
    .filter((doc) => !!(doc.url || doc.url_oparl))
    .map((doc, index) => ({
      id: doc.id ?? index,
      name: doc.name?.trim().replace(/_/g, ' ') ?? '',
      url: (doc.url || doc.url_oparl) as string,
      date: toODataDate(doc.date)
    }))
    .sort((a, b) => odataTimestamp(b.date) - odataTimestamp(a.date));
}

function toTextSections(texts: OpdText[], lang: string): BusinessTextSection[] {
  return [...texts]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((text, index) =>
      toTextSection(
        `text-${text.id ?? index}`,
        localized(text.text, lang),
        localized(text.title, lang)
      )
    )
    .filter((section): section is BusinessTextSection => section !== null);
}

function toSpeechGroups(speeches: OpdSpeech[], lang: string): SpeechGroupVm[] {
  const rows: SpeechVm[] = speeches
    .filter(
      (speech) =>
        speech.id !== undefined && !!localized(speech.text_content, lang)
    )
    .map((speech, index) => {
      const person = relationList(speech.person)[0];
      return {
        id: speech.id as number,
        subjectId: 0,
        council: '',
        speakerFunction: localized(speech.person_role, lang),
        language: '',
        start: toODataDate(speech.date_start),
        title: '',
        businessShortNumber: '',
        speaker: person?.fullname?.trim() ?? '',
        parlGroup: localized(person?.party, lang),
        sortOrder: index
      };
    });

  if (rows.length === 0) return [];

  return [
    {
      key: 'speeches',
      title: '',
      businessShortNumber: '',
      date: '',
      speeches: rows
    }
  ];
}

function toSpeechTexts(
  speeches: OpdSpeech[],
  lang: string
): Record<number, string> {
  const texts: Record<number, string> = {};

  for (const speech of speeches) {
    const text = localized(speech.text_content, lang);
    if (speech.id !== undefined && text) {
      texts[speech.id] = cleanTranscriptText(text);
    }
  }

  return texts;
}
