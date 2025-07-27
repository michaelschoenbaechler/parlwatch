import { Component, Input } from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-text-card',
  templateUrl: './text-card.component.html',
  styleUrls: ['./text-card.component.scss'],
  imports: [SafeHtmlPipe]
})
export class TextCardComponent {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() HtmlText: string;

  constructor() {}
}
