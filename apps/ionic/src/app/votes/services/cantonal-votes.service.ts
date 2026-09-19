import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '../../parliament/services/open-parl-data.service';
import { languageQuery } from '../../parliament/models/open-parl-data.model';
import {
  OpdVote,
  OpdVoting
} from '../../parliament/models/open-parl-data.records';
import { CantonKey } from '../../parliament/models/parliament.model';
import { LoadedVote } from '../models/loaded-vote';
import { toLoadedVote } from '../models/cantonal-vote';
import { VoteFilter } from './votes.service';

/** Only the fields the vote cards render, totals included. */
const LIST_FIELDS = [
  'id',
  'affair_id',
  'date',
  'title',
  'affair_title',
  'results_yes',
  'results_no',
  'results_abstention',
  'results_absent'
].join(',');

const DETAIL_FIELDS = [
  ...LIST_FIELDS.split(','),
  'type',
  'meaning_of_yes',
  'meaning_of_no',
  'updated_at',
  'updated_external_at',
  'url_external'
].join(',');

/**
 * One ballot per member. The person is expanded for the harmonised party,
 * which the breakdown groups on; the ballot itself carries only the
 * canton's own party label.
 */
const BALLOT_FIELDS = [
  'id',
  'voting_id',
  'person_id',
  'person_fullname',
  'vote',
  'person_party',
  'person.party_harmonized'
].join(',');

/** Headroom over the largest cantonal parliament (Zürich, 180 seats). */
const MAX_BALLOTS = 500;

@Injectable({
  providedIn: 'root'
})
export class CantonalVoteService {
  private readonly openParlData = inject(OpenParlDataService);
  private readonly translocoService = inject(TranslocoService);

  /**
   * A page of a canton's council votes, newest first.
   * @param filter The list query; `parliament` must be a canton
   * @returns Votes in the federal shape, each carrying its tally
   */
  getVotes({
    parliament,
    top,
    skip,
    searchTerm
  }: VoteFilter): Observable<LoadedVote[]> {
    const lang = this.translocoService.getActiveLang();

    return this.openParlData
      .fetch<OpdVoting>('votings', {
        body_key: parliament,
        sort_by: '-date',
        offset: skip ?? 0,
        limit: top,
        fields: LIST_FIELDS,
        search: searchTerm?.trim() || undefined,
        ...languageQuery(lang)
      })
      .pipe(
        map((page) =>
          page.data.map((voting) =>
            toLoadedVote(voting, parliament as CantonKey, lang)
          )
        )
      );
  }

  /**
   * One vote with every member's ballot.
   *
   * Two requests: the voting record, and its ballots with their persons,
   * which the record endpoint cannot expand two levels deep.
   * @param parliament The canton
   * @param id The voting id
   * @returns The vote with its ballots and source
   */
  getVote(parliament: CantonKey, id: number): Observable<LoadedVote> {
    const lang = this.translocoService.getActiveLang();

    return forkJoin({
      voting: this.openParlData.fetch<OpdVoting>(`votings/${id}`, {
        fields: DETAIL_FIELDS,
        ...languageQuery(lang)
      }),
      ballots: this.openParlData.fetch<OpdVote>('votes', {
        voting_id: id,
        expand: 'person',
        fields: BALLOT_FIELDS,
        sort_by: 'person_fullname',
        limit: MAX_BALLOTS,
        ...languageQuery(lang)
      })
    }).pipe(
      map(({ voting, ballots }) =>
        toLoadedVote(
          { ...voting.data[0], votes: ballots.data },
          parliament,
          lang
        )
      )
    );
  }
}
