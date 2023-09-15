import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-text-card',
  templateUrl: './text-card.component.html',
  styleUrls: ['./text-card.component.scss']
})
export class TextCardComponent {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() HtmlText: string;

  constructor() {}
}
