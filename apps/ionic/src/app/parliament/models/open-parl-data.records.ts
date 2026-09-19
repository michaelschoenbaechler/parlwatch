import { Localized, Relation } from './open-parl-data.model';

/**
 * The OpenParlData records the app reads, reduced to the fields it uses.
 * Every field is optional: the API omits what a canton does not publish and
 * the services select only what a page renders.
 */

export interface OpdAffair {
  id?: number;
  body_key?: string;
  number?: string | null;
  title?: Localized;
  type_name?: Localized;
  type_harmonized?: Localized;
  type_harmonized_id?: number | null;
  state_name?: Localized;
  begin_date?: string | null;
  updated_at?: string | null;
  url_external?: Localized;
  contributors?: Relation<OpdContributor>;
  events?: Relation<OpdEvent>;
  docs?: Relation<OpdDoc>;
  texts?: Relation<OpdText>;
  speeches?: Relation<OpdSpeech>;
  votings?: Relation<OpdVoting>;
}

export interface OpdContributor {
  id?: number;
  person_id?: number | null;
  type?: string | null;
  fullname?: string | null;
  role_harmonized?: Localized;
  role?: Localized;
  party?: Localized;
  position?: number | null;
}

export interface OpdEvent {
  id?: number;
  date?: string | null;
  position?: number | null;
  title?: Localized;
  title_harmonized?: Localized;
  title_harmonized_id?: number | null;
  actor?: Localized;
}

export interface OpdDoc {
  id?: number;
  name?: string | null;
  url?: string | null;
  url_oparl?: string | null;
  date?: string | null;
  format?: string | null;
}

export interface OpdText {
  id?: number;
  title?: Localized;
  text?: Localized;
  position?: number | null;
}

export interface OpdSpeech {
  id?: number;
  person_id?: number | null;
  affair_id?: number | null;
  date_start?: string | null;
  person_role?: Localized;
  text_content?: Localized;
  person?: Relation<OpdPerson>;
  affair?: Relation<OpdAffair>;
}

export interface OpdVoting {
  id?: number;
  body_key?: string;
  affair_id?: number | null;
  date?: string | null;
  title?: Localized;
  affair_title?: Localized;
  type?: Localized;
  meaning_of_yes?: Localized;
  meaning_of_no?: Localized;
  results_yes?: number | null;
  results_no?: number | null;
  results_abstention?: number | null;
  results_absent?: number | null;
  updated_at?: string | null;
  updated_external_at?: string | null;
  url_external?: Localized;
  votes?: Relation<OpdVote>;
}

/** How one member voted, as the API words it. */
export type OpdVoteValue =
  'yes' | 'no' | 'abstention' | 'absent' | 'further_option' | string;

export interface OpdVote {
  id?: number;
  voting_id?: number | null;
  person_id?: number | null;
  person_fullname?: string | null;
  vote?: OpdVoteValue | null;
  person_party?: Localized;
  person?: Relation<OpdPerson>;
  voting?: Relation<OpdVoting>;
}

export interface OpdPerson {
  id?: number;
  body_key?: string;
  fullname?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  party?: Localized;
  party_harmonized?: Localized;
  party_harmonized_wikidata_id?: string | null;
  parliamentary_group_name?: Localized;
  electoral_district?: Localized;
  occupation?: Localized;
  birthday?: string | null;
  city?: string | null;
  active?: boolean | null;
  image_url_oparl?: string | null;
  image_url_external?: string | null;
  updated_at?: string | null;
  website_parliament_url?: Localized;
  memberships?: Relation<OpdMembership>;
  interests?: Relation<OpdInterest>;
  person_images?: Relation<OpdPersonImage>;
}

/** `type_harmonized_oparl_id` values the app tells apart. */
export const MEMBERSHIP_TYPE_COMMISSION = 2;
export const MEMBERSHIP_TYPE_FRAKTION = 4;
export const MEMBERSHIP_TYPE_PARLIAMENT = 10;

export interface OpdMembership {
  id?: number;
  person_id?: number | null;
  group_id?: number | null;
  begin_date?: string | null;
  end_date?: string | null;
  active?: boolean | null;
  type_harmonized_oparl_id?: number | null;
  type_harmonized?: Localized;
  group_name?: Localized;
  role_name?: Localized;
}

export interface OpdInterest {
  id?: number;
  name?: Localized;
  role_name?: Localized;
  type?: Localized;
  type_payment?: Localized;
  type_payment_harmonized?: string | null;
  place?: string | null;
}

export interface OpdPersonImage {
  id?: number;
  profile_url?: string | null;
  thumb_url?: string | null;
  oparl_url?: string | null;
  latest?: boolean | null;
}

export interface OpdBody {
  id?: number;
  body_key?: string;
  name_de?: string | null;
  name?: string | null;
  legislative_name?: string | null;
  flag_image_oparl_url?: string | null;
  type?: string | null;
}

/** One bucket of an `affairs/group_by/types_harmonized` aggregation. */
export interface OpdTypeGroup {
  type_harmonized_id?: number | null;
  type_harmonized?: Localized;
  count?: number;
}

/** One bucket of a `persons/group_by/parties_harmonized` aggregation. */
export interface OpdPartyGroup {
  party_harmonized_wikidata_id?: string | null;
  party_harmonized?: Localized;
  count?: number;
}
