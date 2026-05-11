import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, AsyncPipe],
    templateUrl: './sidebar.component.html',
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
