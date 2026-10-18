// PROTOTYPE for #55. Throwaway.
import { Component, computed, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DigestPrototypeService, VARIANTS } from './digest-prototype.service';

@Component({
  selector: 'app-prototype-switcher',
  template: `
    @if (enabled) {
      <div class="bar">
        <button type="button" (click)="step(-1)">‹</button>
        <span>{{ label() }}</span>
        <button type="button" (click)="step(1)">›</button>
      </div>
    }
  `,
  styles: `
    .bar {
      position: fixed;
      left: 50%;
      bottom: calc(env(safe-area-inset-bottom) + 64px);
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #111;
      color: #ffe600;
      font:
        600 13px/1 ui-monospace,
        monospace;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      white-space: nowrap;
    }
    button {
      background: none;
      border: 0;
      color: inherit;
      font-size: 20px;
      padding: 0 6px;
    }
  `
})
export class PrototypeSwitcherComponent {
  private readonly service = inject(DigestPrototypeService);
  private readonly router = inject(Router);
  readonly enabled = !environment.production;

  readonly label = computed(() => {
    const v = VARIANTS.find((x) => x.key === this.service.variant());
    return `${v?.key} (${v?.name})`;
  });

  step(delta: number) {
    const i = VARIANTS.findIndex((x) => x.key === this.service.variant());
    const next = VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length].key;
    this.service.variant.set(next);
    this.router
      .navigate([], {
        queryParams: { variant: next },
        queryParamsHandling: 'merge',
        replaceUrl: true
      })
      .catch(console.error);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable]')) return;
    if (event.key === 'ArrowLeft') this.step(-1);
    if (event.key === 'ArrowRight') this.step(1);
  }
}
