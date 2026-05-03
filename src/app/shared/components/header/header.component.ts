import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (showSearch$ | async) {
      <header class="border-b border-gray-200 bg-white px-6 py-4">
        <div class="mx-auto max-w-2xl">
          <input
            type="text"
            placeholder="送信元 / ドメイン / 件名で検索"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>
    }
  `,
})
export class HeaderComponent {
  private router = inject(Router);

  showSearch$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => this.router.url.startsWith('/sources'))
  );
}
