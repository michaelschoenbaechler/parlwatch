import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-watched-news-card',
  templateUrl: './watched-news-card.component.html',
  styleUrls: ['./watched-news-card.component.scss'],
  imports: [IonicModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WatchedNewsCardComponent {
  readonly count = input.required<number>();
  readonly opened = output<void>();
}
