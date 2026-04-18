import { Component, inject, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concat, interval, tap, timer } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@UntilDestroy()
@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.scss'],
  imports: [IonicModule, TranslocoDirective]
})
export class LoadingScreenComponent implements OnInit {
  translocoService = inject(TranslocoService);

  facts: string[];
  currentFact: string;
  shuffledFacts: string[] = [];

  ngOnInit() {
    this.facts = this.translocoService.translate<string[]>([
      'shared.loadingScreen.loadingFact1',
      'shared.loadingScreen.loadingFact2',
      'shared.loadingScreen.loadingFact3',
      'shared.loadingScreen.loadingFact4',
      'shared.loadingScreen.loadingFact5',
      'shared.loadingScreen.loadingFact6',
      'shared.loadingScreen.loadingFact7',
      'shared.loadingScreen.loadingFact8',
      'shared.loadingScreen.loadingFact9',
      'shared.loadingScreen.loadingFact10',
      'shared.loadingScreen.loadingFact11'
    ]);

    this.shuffleFacts();
    let factIndex = -1;

    const initialDelay = timer(2000);
    const factInterval = interval(5000);

    concat(initialDelay, factInterval)
      .pipe(
        untilDestroyed(this),
        tap(() => {
          factIndex++;
          if (factIndex >= this.shuffledFacts.length) {
            this.shuffleFacts();
            factIndex = 0;
          }
          this.currentFact = this.shuffledFacts[factIndex];
        })
      )
      .subscribe();
  }

  shuffleFacts() {
    this.shuffledFacts = [...this.facts];
    for (let i = this.shuffledFacts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledFacts[i], this.shuffledFacts[j]] = [
        this.shuffledFacts[j],
        this.shuffledFacts[i]
      ];
    }
  }
}
