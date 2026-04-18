import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { VoteCardComponent } from '../../components/vote-card/vote-card.component';
import { TextCardComponent } from '../../../shared/components/text-card/text-card.component';
import { LoadingScreenComponent } from '../../../shared/components/loading-screen/loading-screen.component';
import { ErrorScreenComponent } from '../../../shared/components/error-screen/error-screen.component';
import { VoteStore, VotingDecisionFilter } from '../../store/vote';

@Component({
  selector: 'app-vote-detail',
  templateUrl: './vote-detail.page.html',
  styleUrls: ['./vote-detail.page.scss'],
  imports: [
    RouterLink,
    ReactiveFormsModule,
    IonicModule,
    VoteCardComponent,
    TextCardComponent,
    LoadingScreenComponent,
    ErrorScreenComponent,
    TranslocoDirective
  ]
})
export class VoteDetailPage implements OnInit {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly store = inject(VoteStore);

  voteFilterControl = new FormControl<VotingDecisionFilter>('all');
  private readonly voteFilter = toSignal(this.voteFilterControl.valueChanges, {
    initialValue: this.voteFilterControl.value as VotingDecisionFilter
  });

  readonly viewModel = computed(() =>
    this.store.voteDetailViewModel(this.voteFilter() ?? 'all')
  );

  partyMappingDE = {
    'Sozialdemokratische Fraktion': 'SP',
    'Grüne Fraktion': 'Grüne',
    'Fraktion der Schweizerischen Volkspartei': 'SVP',
    'FDP-Liberale Fraktion': 'FDP',
    'Grünliberale Fraktion': 'GLP',
    'Die Mitte-Fraktion. Die Mitte. EVP.': 'Die Mitte'
  };

  ngOnInit() {
    this.store.selectVote(parseInt(this.route.snapshot.params.id));
  }

  retrySearch() {
    this.store.selectVote(parseInt(this.route.snapshot.params.id));
  }

  onClickPerson(id: number) {
    this.router.navigate(['council-member', 'detail', id]);
  }

  goToBusiness() {
    const vm = this.viewModel();
    if (vm.vote) {
      this.router.navigate(['business', 'detail', vm.vote.BusinessNumber]);
    }
  }
}
