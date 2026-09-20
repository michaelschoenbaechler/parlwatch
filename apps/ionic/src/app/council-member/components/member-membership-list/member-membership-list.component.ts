import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ODataDateTimePipe } from '../../../shared/common/pipes/o-data-date-time.pipe';
import { MemberMembership } from '../../models/cantonal-member';

@Component({
  selector: 'app-member-membership-list',
  template: `
    <ul class="membership-list">
      @for (membership of memberships(); track membership.key) {
        <li class="membership">
          <span class="membership-group">{{ membership.group }}</span>
          @if (membership.role || membership.since) {
            <p class="membership-meta">
              @if (membership.role) {
                <span>{{ membership.role }}</span>
              }
              @if (membership.since) {
                <span>seit {{ membership.since | oDataDateTime }}</span>
              }
            </p>
          }
        </li>
      }
    </ul>
  `,
  styles: `
    .membership-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .membership {
      padding: 0.5rem 0;
      border-bottom: 1px solid #ebebeb;
    }

    .membership:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .membership:first-child {
      padding-top: 0;
    }

    .membership-group {
      font-size: 15px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .membership-meta {
      margin: 0.125rem 0 0 0;
      font-size: 13px;
      color: #666666;
    }

    .membership-meta span + span::before {
      content: ' · ';
    }
  `,
  imports: [ODataDateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberMembershipListComponent {
  readonly memberships = input.required<MemberMembership[]>();
}
