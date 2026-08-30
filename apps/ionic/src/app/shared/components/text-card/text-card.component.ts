import { Component, input } from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-text-card',
  templateUrl: './text-card.component.html',
  styleUrls: ['./text-card.component.scss'],
  imports: [SafeHtmlPipe]
})
export class TextCardComponent {
  readonly title = input<string>();
  readonly subtitle = input<string>();
  readonly HtmlText = input<string>();

  constructor() {}
}
