import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concat, interval, tap, timer } from 'rxjs';
import { IonicModule } from '@ionic/angular';

@UntilDestroy()
@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class LoadingScreenComponent implements OnInit {
  currentFact: string;
  facts: string[] = [
    'Das Schweizer Parlament ist ein Zweikammersystem, bestehend aus dem Nationalrat und dem Ständerat.',
    'Der Nationalrat hat 200 Mitglieder, während der Ständerat 46 Mitglieder hat.',
    'Die Parlamentarierinnen und Parlamentarier werden vom Volk für eine Amtszeit von vier Jahren gewählt. ',
    'Beide Kammern haben die gleichen Kompetenzen und beschliessen über die gleichen Geschäfte.',
    'Das Parlament berät und verabschiedet die Bundesgesetze, die für das ganze Land gelten. Deswegen wird das Parlament «Legislative» genannt.',
    'Das Parlament überwacht die Tätigkeit des Bundesrates, der Bundesverwaltung, des Bundesgerichts und der Unternehmen, die Bundesaufgaben erfüllen wie die Post oder die SBB',
    'Das Parlament bestimmt die finanziellen Mittel, die dem Bund für die Erfüllung seiner Aufgaben zur Verfügung stehen.',
    'Wieso hat das Bundeshaus eine Kuppel? Schon mal einen Zirkus mit Flachdach gesehen?',
    'National- und Ständerat fassen die meisten Beschlüsse getrennt.',
    'Die Mitglieder beider Kammern kommen regelmässig zu den Sessionen zusammen. Sessionen finden vier Mal jährlich statt.',
    'Einen grossen Teil ihrer Arbeiten verrichten die Parlamentarierinnen und Parlamentarier zwischen den Sessionen in den parlamentarischen Kommissionen.'
  ];
  shuffledFacts: string[] = [];

  constructor() {}

  ngOnInit() {
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
