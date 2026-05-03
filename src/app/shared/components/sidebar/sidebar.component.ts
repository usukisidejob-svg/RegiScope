import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, AsyncPipe],
    template: `
    <aside class="w-60 bg-white border-r border-gray-200 p-4 flex flex-col gap-2">

      <h1 class="text-lg font-semibold mb-4">
        RegiScope
      </h1>

      <!-- Account -->
      <a
        routerLink="/account"
        routerLinkActive="bg-blue-50 text-blue-700"
        class="px-4 py-2 rounded-lg hover:bg-gray-100"
      >
        Account
      </a>

      <!-- Sources -->
      <a
        routerLink="/sources"
        routerLinkActive="bg-blue-50 text-blue-700"
        [class.opacity-50]="!(hasScanned$ | async)"
        [class.pointer-events-none]="!(hasScanned$ | async)"
        [class.cursor-not-allowed]="!(hasScanned$ | async)"
        class="px-4 py-2 rounded-lg hover:bg-gray-100"
      >
        Sources
      </a>

    </aside>
  `,
})
export class SidebarComponent {
    private accountService = inject(AccountService);

    /**
     * 現在のアカウントがスキャン済みかどうか
     * → false の間は Sources を無効化
     */
    hasScanned$ = combineLatest([
        this.accountService.accounts$,
        this.accountService.currentAccountId$,
    ]).pipe(
        map(() => this.accountService.hasCurrentAccountScanned())
    );
}
