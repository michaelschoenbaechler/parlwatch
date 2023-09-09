import { Directive, HostListener } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { Platform } from '@ionic/angular';

@Directive({
  selector: '[appHideKeyboardOnEnter]'
})
export class HideKeyboardOnEnterDirective {
  constructor(private platform: Platform) {}

  @HostListener('keyup', ['$event']) onKeyUp(event: KeyboardEvent) {
    if (
      (event.key === 'Enter' || event.code == 'Enter') &&
      this.platform.is('capacitor')
    ) {
      Keyboard.hide();
    }
  }
}
