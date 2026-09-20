import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MemberCouncil, Voting } from 'swissparl';
import {
  isCantonal,
  ParliamentKey
} from '../../shared/parliament/models/parliament.model';
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

export interface SpeechPage {
  speeches: SpeechVm[];
  texts: Record<number, string>;
  hasMore: boolean;
}

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

  getVotingRecord(parliament: ParliamentKey, id: number): Observable<Voting[]> {
    return isCantonal(parliament)
      ? this.cantonal.getVotingRecord(id).pipe(map(toVotings))
      : this.federal.getVotes(id);
  }

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

  getSpeechText(parliament: ParliamentKey, id: number): Observable<string> {
    return isCantonal(parliament) ? of('') : this.transcripts.getSpeechText(id);
  }

  getCantonalParties(parliament: ParliamentKey): Observable<FacetOption[]> {
    return isCantonal(parliament)
      ? this.cantonal.getParties(parliament)
      : of([]);
  }
}

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
