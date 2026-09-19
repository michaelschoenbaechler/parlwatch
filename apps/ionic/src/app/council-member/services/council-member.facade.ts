import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MemberCouncil, Voting } from 'swissparl';
import {
  isCantonal,
  ParliamentKey
} from '../../parliament/models/parliament.model';
import { TranscriptService } from '../../shared/services/transcript.service';
import {
  SpeechVm,
  toSpeeches,
  withSubjectTitles
} from '../../shared/models/transcript.model';
import { LoadedMember, MemberVoteRecord } from '../models/cantonal-member';
import { FacetOption } from '../models/member-facets';
import { CantonalMemberService } from './cantonal-member.service';
import {
  CouncilMemberFilter,
  CouncilMemberService
} from './council-member.service';

/** One page of a member's speeches, as the speech store keeps it. */
export interface SpeechPage {
  speeches: SpeechVm[];
  /** Bodies that came with the page; federal pages carry none. */
  texts: Record<number, string>;
  /** Whether another page may follow. */
  hasMore: boolean;
}

/**
 * Picks the federal or the cantonal member source from the parliament key,
 * so the stores and the pages are written once against one surface.
 */
@Injectable({
  providedIn: 'root'
})
export class CouncilMemberFacade {
  private readonly federal = inject(CouncilMemberService);
  private readonly cantonal = inject(CantonalMemberService);
  private readonly transcripts = inject(TranscriptService);

  getMembers(filter: CouncilMemberFilter): Observable<MemberCouncil[]> {
    return isCantonal(filter.parliament)
      ? this.cantonal.getMembers(filter)
      : this.federal.getMembers(filter);
  }

  getMember(parliament: ParliamentKey, id: number): Observable<LoadedMember> {
    return isCantonal(parliament)
      ? this.cantonal.getMember(parliament, id)
      : this.federal.getMemberById(id);
  }

  /**
   * How a member voted, newest first, in the federal `Voting` shape the
   * voting-record card renders.
   * @param parliament The member's parliament
   * @param id The member's id
   * @returns The member's ballots
   */
  getVotingRecord(parliament: ParliamentKey, id: number): Observable<Voting[]> {
    return isCantonal(parliament)
      ? this.cantonal.getVotingRecord(id).pipe(map(toVotings))
      : this.federal.getVotes(id);
  }

  /**
   * One page of a member's speeches.
   *
   * Federally the titles come from a second collection, so both land
   * together and the list never renders a page of untitled rows first. A
   * canton ships everything, bodies included, in one unpaged list.
   * @param parliament The member's parliament
   * @param id The member's id
   * @param pageSize How many speeches a page holds
   * @param skip How many to skip
   * @returns The page
   */
  getSpeechPage(
    parliament: ParliamentKey,
    id: number,
    pageSize: number,
    skip: number
  ): Observable<SpeechPage> {
    if (isCantonal(parliament)) {
      if (skip > 0) return of({ speeches: [], texts: {}, hasMore: false });
      return this.cantonal.getSpeeches(parliament, id).pipe(
        map(({ groups, texts }) => ({
          speeches: groups.flatMap((group) => group.speeches),
          texts,
          hasMore: false
        }))
      );
    }

    return this.transcripts.getSpeechesByMember(id, pageSize, skip).pipe(
      map((transcripts) => toSpeeches(transcripts)),
      switchMap((speeches) =>
        forkJoin({
          speeches: [speeches],
          titles: this.transcripts.getSubjectTitles(
            speeches.map((speech) => speech.subjectId)
          )
        })
      ),
      map(({ speeches, titles }) => ({
        speeches: withSubjectTitles(speeches, titles),
        texts: {},
        hasMore: speeches.length === pageSize
      }))
    );
  }

  /**
   * The body of a speech. Cantonal bodies arrive with the page, so only a
   * federal one is fetched.
   * @param parliament The member's parliament
   * @param id The speech id
   * @returns The body, or an empty string
   */
  getSpeechText(parliament: ParliamentKey, id: number): Observable<string> {
    return isCantonal(parliament) ? of('') : this.transcripts.getSpeechText(id);
  }

  /**
   * The party options of a cantonal member filter. Federal options come from
   * the facet store's own three-collection join and are not routed here.
   * @param parliament The parliament being filtered
   * @returns The harmonised parties, or none for the federal parliament
   */
  getCantonalParties(parliament: ParliamentKey): Observable<FacetOption[]> {
    return isCantonal(parliament)
      ? this.cantonal.getParties(parliament)
      : of([]);
  }
}

/**
 * Present a cantonal voting record through the federal `Voting` shape.
 * `IdVote` carries the voting, which is where a tap on the row leads.
 * @param records The member's ballots
 * @returns The same ballots as `Voting` rows
 */
function toVotings(records: MemberVoteRecord[]): Voting[] {
  return records.map(
    (record) =>
      ({
        ID: record.votingId,
        IdVote: record.votingId,
        BusinessNumber: record.businessNumber ?? undefined,
        BusinessTitle: record.title,
        Subject: '',
        Decision: record.decision,
        VoteEnd: record.date
      }) as Voting
  );
}
