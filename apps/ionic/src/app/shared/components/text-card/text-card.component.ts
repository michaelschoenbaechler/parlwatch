import { Component, input } from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-text-card',
  templateUrl: './text-card.component.html',
  styleUrls: ['./text-card.component.scss'],
  imports: [SafeHtmlPipe]
})
export class TextCardComponent {
  readonly title = input<string>(undefined);
  readonly subtitle = input<string>(undefined);
  readonly HtmlText = input<string>(undefined);

  constructor() {}
}
