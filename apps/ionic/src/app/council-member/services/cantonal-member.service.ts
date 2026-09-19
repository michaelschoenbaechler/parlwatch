import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MemberCouncil } from 'swissparl';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '../../parliament/services/open-parl-data.service';
import {
  languageQuery,
  localized,
  relationList,
  toODataDate
} from '../../parliament/models/open-parl-data.model';
import {
  MEMBERSHIP_TYPE_COMMISSION,
  MEMBERSHIP_TYPE_FRAKTION,
  OpdInterest,
  OpdMembership,
  OpdPartyGroup,
  OpdPerson,
  OpdSpeech,
  OpdVote
} from '../../parliament/models/open-parl-data.records';
import { CantonKey } from '../../parliament/models/parliament.model';
import {
  cleanTranscriptText,
  groupSpeechesByBusiness,
  SpeechVm
} from '../../shared/models/transcript.model';
import { toDecisionCode } from '../../votes/models/cantonal-vote';
import {
  LoadedMember,
  MemberMembership,
  MemberSpeeches,
  MemberVoteRecord
} from '../models/cantonal-member';
import { FacetOption } from '../models/member-facets';
import { InterestGroupVm } from '../models/person-interest';
import { CouncilMemberFilter } from './council-member.service';

/** Only the fields the member cards render. */
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

/** How much of a member's record the detail page shows. */
const MAX_VOTES = 100;
const MAX_SPEECHES = 50;

/**
 * Harmonised parties are keyed by Wikidata id (`Q303745`). The filter form
 * and the federal filter shape work with numbers, so the id travels as its
 * numeric part and is put back together for the request.
 */
const WIKIDATA_PREFIX = 'Q';

/**
 * Turn a Wikidata id into the number the filter carries.
 * @param wikidataId The id, e.g. `Q303745`
 * @returns Its numeric part, or undefined for anything else
 */
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

  /**
   * A page of a canton's sitting members, by last name.
   * @param filter The list query; `parliament` must be a canton
   * @returns Members in the federal card shape
   */
  getMembers({
    parliament,
    top,
    skip,
    searchTerm,
    parties
  }: CouncilMemberFilter): Observable<MemberCouncil[]> {
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

  /**
   * The harmonised parties represented in a canton, for the party filter.
   * @param parliament The canton
   * @returns One option per party, alphabetical
   */
  getParties(parliament: CantonKey): Observable<FacetOption[]> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdPartyGroup>('persons/group_by/parties_harmonized', {
        body_key: parliament,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toPartyOptions(page.data, lang)));
  }

  /**
   * One member with ID card, memberships and interests, in one request.
   * @param parliament The canton
   * @param id The person id
   * @returns The member with the cantonal sections attached
   */
  getMember(parliament: CantonKey, id: number): Observable<LoadedMember> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdPerson>(`persons/${id}`, {
        expand: DETAIL_EXPAND,
        fields: DETAIL_FIELDS,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toLoadedMember(page.data[0], parliament, lang)));
  }

  /**
   * How a member voted, newest first, where the canton publishes ballots.
   * @param id The person id
   * @returns One entry per ballot with a known voting
   */
  getVotingRecord(id: number): Observable<MemberVoteRecord[]> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdVote>(`persons/${id}/votes`, {
        expand: 'voting',
        fields: VOTE_FIELDS,
        sort_by: '-id',
        limit: MAX_VOTES,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toVotingRecord(page.data, lang)));
  }

  /**
   * A member's speeches with a transcript, newest first.
   * @param id The person id
   * @returns Speeches grouped by business, bodies included
   */
  getSpeeches(id: number): Observable<MemberSpeeches> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdSpeech>(`persons/${id}/speeches`, {
        expand: 'affair',
        fields: SPEECH_FIELDS,
        sort_by: '-date_start',
        limit: MAX_SPEECHES,
        ...languageQuery(lang)
      })
      .pipe(map((page) => toMemberSpeeches(page.data, lang)));
  }
}

/**
 * Map a person onto the federal member card shape.
 *
 * The canton's own party label takes the abbreviation slot and the
 * electoral district the council slot, so the card reads "SP · II Zürich
 * 3+9" the way it reads "SP Nationalrat" federally. The coat of arms on the
 * card is the canton's.
 * @param person The person as the API returned it
 * @param parliament The canton
 * @param lang The app's active language
 * @returns The member
 */
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
    PartyName: localized(person.party_harmonized, lang) || localized(person.party, lang),
    ParlGroupName: localized(person.parliamentary_group_name, lang),
    CouncilName: localized(person.electoral_district, lang),
    CantonName: '',
    CantonAbbreviation: parliament,
    Active: person.active ?? true,
    DateOfBirth: toODataDate(person.birthday)
  } as MemberCouncil;
}

/**
 * Map a `group_by` aggregation onto the filter's option shape.
 * @param groups Aggregation buckets
 * @param lang The app's active language
 * @returns One option per party with a Wikidata id, alphabetical
 */
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

/**
 * Map a fully expanded person onto the detail page's model.
 * @param person The person with memberships, interests and images expanded
 * @param parliament The canton
 * @param lang The app's active language
 * @returns The member with the cantonal sections
 */
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
      commissions: toMemberships(
        memberships,
        MEMBERSHIP_TYPE_COMMISSION,
        lang
      ),
      interests: toInterestGroups(relationList(person.interests), lang),
      source: {
        updatedAt: toODataDate(person.updated_at),
        url: localized(person.website_parliament_url, lang)
      }
    }
  };
}

/**
 * The member's seats of one harmonised group type.
 * @param memberships Active memberships
 * @param type The harmonised group type to keep
 * @param lang The app's active language
 * @returns One entry per named group
 */
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

/**
 * Drop the role when it only says "member": on a list of memberships that
 * goes without saying, and it would pad every row.
 * @param role The role as the canton words it
 * @returns The role, or an empty string for a plain member
 */
function withoutPlainMember(role: string): string {
  return /^(mitglied|membre|membro)$/i.test(role) ? '' : role;
}

/**
 * Group a member's declared interests by legal form, the way the federal
 * register is shown. Cantons rarely record a form, so most land in the
 * unspecified group, which the page titles as "further interests".
 * @param interests Interest rows
 * @param lang The app's active language
 * @returns One group per form, named forms first
 */
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
      paid: isPaid(interest)
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

/**
 * Whether the register records the mandate as paid. The harmonised value is
 * `paid` or `honorary`; most cantons record neither, which the badge shows
 * as unpaid because it has no third state.
 * @param interest The interest row
 * @returns True when the register says the mandate is paid
 */
function isPaid(interest: OpdInterest): boolean {
  return (interest.type_payment_harmonized ?? '').toLowerCase() === 'paid';
}

/**
 * Map ballots with their votings onto the voting-record rows.
 * @param votes Ballot rows with the voting expanded
 * @param lang The app's active language
 * @returns One row per ballot whose voting is known, newest first
 */
export function toVotingRecord(
  votes: OpdVote[],
  lang: string
): MemberVoteRecord[] {
  const records: MemberVoteRecord[] = [];

  for (const vote of votes) {
    const voting = relationList(vote.voting)[0];
    const votingId = vote.voting_id ?? voting?.id;
    if (!voting || !votingId) continue;

    records.push({
      votingId,
      title:
        localized(voting.affair_title, lang) || localized(voting.title, lang),
      businessNumber: voting.affair_id ?? null,
      decision: toDecisionCode(vote.vote),
      date: toODataDate(voting.date)
    });
  }

  return records;
}

/**
 * Map a member's speeches onto the speech list, grouped by business.
 * @param speeches Speech rows with the affair expanded
 * @param lang The app's active language
 * @returns The groups and the bodies keyed by speech id
 */
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
