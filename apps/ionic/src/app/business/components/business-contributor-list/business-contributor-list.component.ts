import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BusinessContributor } from '../../models/cantonal-business';

/** The people and bodies behind a cantonal business, members tappable. */
@Component({
  selector: 'app-business-contributor-list',
  template: `
    <ion-list class="contributor-list" lines="full">
      @for (
        contributor of contributors();
        track contributor.key;
        let last = $last
      ) {
        <ion-item
          [button]="contributor.personId !== null"
          [detail]="contributor.personId !== null"
          [lines]="last ? 'none' : 'full'"
          (click)="onSelect(contributor)"
        >
          <ion-label class="ion-text-wrap">
            <h3>{{ contributor.name }}</h3>
            @if (contributor.role || contributor.party) {
              <p>
                {{ contributor.role }}
                @if (contributor.role && contributor.party) {
                  <span> · </span>
                }
                {{ contributor.party }}
              </p>
            }
          </ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: `
    .contributor-list {
      padding: 0;
      background: transparent;
    }

    ion-item {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
      --border-color: #ebebeb;
      --detail-icon-color: var(--ion-color-primary);
      --detail-icon-opacity: 1;
    }

    ion-label h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    ion-label p {
      margin: 0.125rem 0 0 0;
      font-size: 13px;
      color: #666666;
    }
  `,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessContributorListComponent {
  readonly contributors = input.required<BusinessContributor[]>();
  readonly personSelected = output<number>();

  /**
   * Open a contributor's member page; departments and committees have none.
   * @param contributor The row that was tapped
   */
  onSelect(contributor: BusinessContributor) {
    if (contributor.personId !== null) {
      this.personSelected.emit(contributor.personId);
    }
  }
}
