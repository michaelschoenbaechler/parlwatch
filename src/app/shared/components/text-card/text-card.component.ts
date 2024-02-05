import { Component, Input } from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-text-card',
  templateUrl: './text-card.component.html',
  styleUrls: ['./text-card.component.scss'],
  standalone: true,
  imports: [NgIf, SafeHtmlPipe]
})
export class TextCardComponent {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() HtmlText: string;

  constructor() {}
}
