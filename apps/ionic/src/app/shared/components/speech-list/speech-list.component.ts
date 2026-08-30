import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { SpeechGroupVm, SpeechVm } from '../../models/transcript.model';
import { ODataDateTimePipe } from '../../pipes/o-data-date-time.pipe';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-speech-list',
  templateUrl: './speech-list.component.html',
  styleUrls: ['./speech-list.component.scss'],
  imports: [IonicModule, ODataDateTimePipe, SafeHtmlPipe, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpeechListComponent {
  readonly groups = input.required<SpeechGroupVm[]>();
  /** Bodies already loaded, keyed by speech id. */
  readonly texts = input.required<Record<number, string>>();
  /** The speech whose body is in flight, if any. */
  readonly loadingTextId = input<number | null>(null);
  /**
   * Language the app is showing. A speech delivered in another language is
   * badged, because debates are recorded verbatim and never translated.
   */
  readonly uiLanguage = input<string>('');

  /** Asks the container to fetch a body the list does not have yet. */
  readonly textRequested = output<number>();

  private readonly openId = signal<number | null>(null);

  /**
   * Expand a speech, fetching its body the first time it is opened.
   * @param speech The speech that was tapped
   */
  toggle(speech: SpeechVm) {
    if (this.openId() === speech.id) {
      this.openId.set(null);
      return;
    }

    this.openId.set(speech.id);
    if (this.texts()[speech.id] === undefined) {
      this.textRequested.emit(speech.id);
    }
  }

  isOpen(speech: SpeechVm): boolean {
    return this.openId() === speech.id;
  }

  /**
   * Whether a speech was delivered in a language the reader is not being
   * served the rest of the app in.
   * @param speech The speech
   * @returns True when the language differs and is known
   */
  isForeignLanguage(speech: SpeechVm): boolean {
    const language = speech.language.toUpperCase();
    return !!language && language !== this.uiLanguage().toUpperCase();
  }
}
