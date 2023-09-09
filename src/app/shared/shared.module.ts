import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { HideKeyboardOnEnterDirective } from './directives/hide-keyboard-on-enter.directive';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { IonicModule } from '@ionic/angular';
import { ErrorScreenComponent } from './components/error-screen/error-screen.component';
import { TextCardComponent } from './components/text-card/text-card.component';
import { NoContentScreenComponent } from './components/no-content-screen/no-content-screen.component';
import { ODataDateTimePipe } from './pipes/o-data-date-time.pipe';

@NgModule({
  declarations: [
    SafeHtmlPipe,
    ODataDateTimePipe,
    HideKeyboardOnEnterDirective,
    LoadingScreenComponent,
    ErrorScreenComponent,
    NoContentScreenComponent,
    TextCardComponent
  ],
  imports: [CommonModule, IonicModule],
  exports: [
    SafeHtmlPipe,
    ODataDateTimePipe,
    HideKeyboardOnEnterDirective,
    LoadingScreenComponent,
    ErrorScreenComponent,
    NoContentScreenComponent,
    TextCardComponent
  ]
})
export class SharedModule {}
