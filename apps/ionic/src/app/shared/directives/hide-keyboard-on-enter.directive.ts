import { Directive, HostListener, inject } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { Platform } from '@ionic/angular';

@Directive({
  selector: '[appHideKeyboardOnEnter]',
  standalone: true
})
export class HideKeyboardOnEnterDirective {
  private platform = inject(Platform);

  @HostListener('keyup', ['$event']) onKeyUp(event: KeyboardEvent) {
    if (
      (event.key === 'Enter' || event.code == 'Enter') &&
      this.platform.is('capacitor')
    ) {
      Keyboard.hide();
    }
  }
}
