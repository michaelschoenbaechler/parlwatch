import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MemberCouncil } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '@parlwatch/shared/open-parl-data/services';
import {
  languageQuery,
  localized,
  MEMBERSHIP_TYPE_COMMISSION,
  MEMBERSHIP_TYPE_FRAKTION,
  OpdInterest,
  OpdMembership,
  OpdPartyGroup,
  OpdPerson,
  OpdSpeech,
  OpdVote,
  relationList,
  singleRecord,
  toODataDate
} from '@parlwatch/shared/open-parl-data/models';
import { CantonKey, cantonOf } from '@parlwatch/shared/parliament/models';
import {
  cleanTranscriptText,
  groupSpeechesByBusiness,
  odataTimestamp,
  SpeechVm,
  toDecisionCode
} from '@parlwatch/shared/common/models';
import {
  LoadedMember,
  MemberMembership,
  MemberSpeeches,
  MemberVoteRecord
} from '../models/cantonal-member';
import { FacetOption } from '../models/member-facets';
import { InterestGroupVm } from '../models/person-interest';
import { CouncilMemberFilter } from './council-member.service';

const LIST_FIELDS = [
  'id',
  'firstname',
  'lastname',
  'party',
  'party_harmonized',
  'electoral_district'
].join(',');

const DETAIL_FIELDS = [
  'id',
  'body_key',
  'firstname',
  'lastname',
  'party',
  'party_harmonized',
  'parliamentary_group_name',
  'electoral_district',
  'occupation',
  'birthday',
  'city',
  'active',
  'image_url_oparl',
  'updated_at',
  'website_parliament_url',
  'memberships.id',
  'memberships.group_name',
  'memberships.role_name',
  'memberships.type_harmonized_oparl_id',
  'memberships.active',
  'memberships.begin_date',
  'interests.id',
  'interests.name',
  'interests.role_name',
  'interests.type',
  'interests.type_payment',
  'interests.type_payment_harmonized',
  'person_images.profile_url',
  'person_images.latest'
].join(',');

const DETAIL_EXPAND = 'memberships,interests,person_images';

const VOTE_FIELDS = [
  'id',
  'vote',
  'voting_id',
  'voting.title',
  'voting.affair_title',
  'voting.affair_id',
  'voting.date'
].join(',');

const SPEECH_FIELDS = [
  'id',
  'date_start',
  'affair_id',
  'text_content',
  'affair.title',
  'affair.number'
].join(',');

const MAX_VOTES = 100;
const MAX_SPEECHES = 50;

const WIKIDATA_PREFIX = 'Q';

export function wikidataNumber(
  wikidataId: string | null | undefined
): number | undefined {
  const match = /^Q(\d+)$/.exec(wikidataId ?? '');
  return match ? Number(match[1]) : undefined;
}

@Injectable({
  providedIn: 'root'
})
export class CantonalMemberService {
  private readonly openParlData = inject(OpenParlDataService);
  private readonly translocoService = inject(TranslocoService);

  getMembers(filter: CouncilMemberFilter): Observable<MemberCouncil[]> {
    const { parliament, top, skip, searchTerm, parties } = filter;
    const lang = this.translocoService.getActiveLang();
    const partyIds = (parties ?? []).map((id) => `${WIKIDATA_PREFIX}${id}`);

    return this.openParlData
      .fetch<OpdPerson>('persons', {
        body_key: parliament,
        active: true,
        sort_by: 'lastname,firstname',
        offset: skip ?? 0,
        limit: top,
        fields: LIST_FIELDS,
        party_harmonized_wikidata_id: partyIds.length
          ? partyIds.join(',')
          : undefined,
        search: searchTerm?.trim() || undefined,
        ...languageQuery(lang)
      })
      .pipe(
        map((page) =>
          page.data.map((person) =>
            toMember(person, parliament as CantonKey, lang)
          )
        )
      );
  }

  getParties(parliament: CantonKey): Observable<FacetOption[]> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdPartyGroup>('persons/group_by/parties_harmonized', {
        body_key: parliament,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toPartyOptions(page.data, lang)));
  }

  getMember(parliament: CantonKey, id: number): Observable<LoadedMember> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdPerson>(`persons/${id}`, {
        expand: DETAIL_EXPAND,
        fields: DETAIL_FIELDS,
        ...languageQuery(lang)
      })
      .pipe(
        map((page) => toLoadedMember(singleRecord(page.data), parliament, lang))
      );
  }

  getVotingRecord(id: number): Observable<MemberVoteRecord[]> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdVote>('votes', {
        person_id: id,
        exclude_null: 'voting_id',
        expand: 'voting',
        fields: VOTE_FIELDS,
        sort_by: '-voting_id',
        limit: MAX_VOTES,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toVotingRecord(page.data, lang)));
  }

  getSpeeches(parliament: CantonKey, id: number): Observable<MemberSpeeches> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdSpeech>('speeches', {
        person_id: id,
        exclude_null: `text_content_${cantonOf(parliament).language}`,
        expand: 'affair',
        fields: SPEECH_FIELDS,
        sort_by: '-date_start',
        limit: MAX_SPEECHES,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toMemberSpeeches(page.data, lang)));
  }
}

export function toMember(
  person: OpdPerson,
  parliament: CantonKey,
  lang: string
): MemberCouncil {
  return {
    ID: person.id,
    PersonNumber: person.id,
    FirstName: person.firstname?.trim() ?? '',
    LastName: person.lastname?.trim() ?? '',
    PartyAbbreviation: localized(person.party, lang),
    PartyName:
      localized(person.party_harmonized, lang) || localized(person.party, lang),
    ParlGroupName: localized(person.parliamentary_group_name, lang),
    CouncilName: localized(person.electoral_district, lang),
    CantonName: '',
    CantonAbbreviation: parliament,
    Active: person.active ?? true,
    DateOfBirth: toODataDate(person.birthday)
  } as MemberCouncil;
}

export function toPartyOptions(
  groups: OpdPartyGroup[],
  lang: string
): FacetOption[] {
  const options = new Map<number, FacetOption>();

  for (const group of groups) {
    const id = wikidataNumber(group.party_harmonized_wikidata_id);
    const label = localized(group.party_harmonized, lang);
    if (id === undefined || !label || options.has(id)) continue;
    options.set(id, { id, label });
  }

  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function toLoadedMember(
  person: OpdPerson,
  parliament: CantonKey,
  lang: string
): LoadedMember {
  const memberships = relationList(person.memberships).filter(
    (membership) => membership.active !== false
  );
  const image = relationList(person.person_images).find(
    (candidate) => candidate.latest !== false && candidate.profile_url
  );

  return {
    ...toMember(person, parliament, lang),
    cantonal: {
      parliament,
      imageUrl: image?.profile_url ?? person.image_url_oparl ?? '',
      electoralDistrict: localized(person.electoral_district, lang),
      occupation: localized(person.occupation, lang),
      fraktion: toMemberships(memberships, MEMBERSHIP_TYPE_FRAKTION, lang),
      commissions: toMemberships(memberships, MEMBERSHIP_TYPE_COMMISSION, lang),
      interests: toInterestGroups(relationList(person.interests), lang),
      source: {
        updatedAt: toODataDate(person.updated_at),
        url: localized(person.website_parliament_url, lang)
      }
    }
  };
}

function toMemberships(
  memberships: OpdMembership[],
  type: number,
  lang: string
): MemberMembership[] {
  return memberships
    .filter((membership) => membership.type_harmonized_oparl_id === type)
    .map((membership, index) => ({
      key: `membership-${membership.id ?? index}`,
      group: localized(membership.group_name, lang),
      role: withoutPlainMember(localized(membership.role_name, lang)),
      since: toODataDate(membership.begin_date)
    }))
    .filter((membership) => !!membership.group)
    .sort((a, b) => a.group.localeCompare(b.group));
}

function withoutPlainMember(role: string): string {
  return /^(mitglied|membre|membro)$/i.test(role) ? '' : role;
}

function toInterestGroups(
  interests: OpdInterest[],
  lang: string
): InterestGroupVm[] {
  const groups = new Map<string, InterestGroupVm>();

  for (const interest of interests) {
    const organisation = localized(interest.name, lang);
    if (!organisation) continue;

    const type = localized(interest.type, lang);
    let group = groups.get(type);
    if (!group) {
      group = { type, interests: [] };
      groups.set(type, group);
    }

    group.interests.push({
      id: String(interest.id ?? `${type}-${organisation}`),
      organisation,
      role: localized(interest.role_name, lang),
      body: '',
      paid: isPaid(interest),
      paymentRecorded: !!interest.type_payment_harmonized
    });
  }

  const ordered = [...groups.values()].sort(
    (a, b) =>
      Number(a.type === '') - Number(b.type === '') ||
      a.type.localeCompare(b.type)
  );

  for (const group of ordered) {
    group.interests.sort((a, b) =>
      a.organisation.localeCompare(b.organisation)
    );
  }

  return ordered;
}

function isPaid(interest: OpdInterest): boolean {
  return (interest.type_payment_harmonized ?? '').toLowerCase() === 'paid';
}

export function toVotingRecord(
  votes: OpdVote[],
  lang: string
): MemberVoteRecord[] {
  const records: MemberVoteRecord[] = [];

  for (const vote of votes) {
    const voting = relationList(vote.voting)[0];
    if (!voting || !vote.voting_id) continue;

    records.push({
      votingId: vote.voting_id,
      title:
        localized(voting.affair_title, lang) || localized(voting.title, lang),
      businessNumber: voting.affair_id ?? null,
      decision: toDecisionCode(vote.vote),
      date: toODataDate(voting.date)
    });
  }

  return records.sort(
    (a, b) => odataTimestamp(b.date) - odataTimestamp(a.date)
  );
}

export function toMemberSpeeches(
  speeches: OpdSpeech[],
  lang: string
): MemberSpeeches {
  const rows: SpeechVm[] = [];
  const texts: Record<number, string> = {};

  for (const speech of speeches) {
    const text = localized(speech.text_content, lang);
    if (speech.id === undefined || !text) continue;

    const affair = relationList(speech.affair)[0];
    texts[speech.id] = cleanTranscriptText(text);
    rows.push({
      id: speech.id,
      subjectId: speech.affair_id ?? 0,
      council: '',
      speakerFunction: '',
      language: '',
      start: toODataDate(speech.date_start),
      title: localized(affair?.title, lang),
      businessShortNumber: affair?.number?.trim() ?? '',
      speaker: '',
      parlGroup: '',
      sortOrder: 0
    });
  }

  return { groups: groupSpeechesByBusiness(rows), texts };
}
