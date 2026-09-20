import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '../../shared/open-parl-data/services/open-parl-data.service';
import {
  languageQuery,
  singleRecord
} from '../../shared/open-parl-data/models/open-parl-data.model';
import {
  OpdVote,
  OpdVoting
} from '../../shared/open-parl-data/models/open-parl-data.records';
import { CantonKey } from '../../shared/parliament/models/parliament.model';
import { LoadedVote } from '../models/loaded-vote';
import { toLoadedVote } from '../models/cantonal-vote';
import { VoteFilter } from './votes.service';

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

const BALLOT_FIELDS = [
  'id',
  'voting_id',
  'person_id',
  'person_fullname',
  'vote',
  'person_party',
  'person.party_harmonized'
].join(',');

const MAX_BALLOTS = 500;

@Injectable({
  providedIn: 'root'
})
export class CantonalVoteService {
  private readonly openParlData = inject(OpenParlDataService);
  private readonly translocoService = inject(TranslocoService);

  getVotes(filter: VoteFilter): Observable<LoadedVote[]> {
    const { parliament, top, skip, searchTerm } = filter;
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
          { ...singleRecord(voting.data), votes: ballots.data },
          parliament,
          lang
        )
      )
    );
  }
}
