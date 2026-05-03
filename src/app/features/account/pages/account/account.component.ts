import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { AccountService } from '../../../../core/services/account.service';

@Component({
    selector: 'app-account',
    standalone: true,
    imports: [AsyncPipe, RouterLink],
    template: `
    <section class="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Account</h1>
        <p class="mt-2 text-gray-600">
          スキャンするGmailアカウントを選択してください
        </p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">アカウント選択</h2>

          @if (accounts$ | async; as accounts) {
            <span class="text-sm text-gray-500">
              {{ accounts.length }}個のアカウント
            </span>
          }
        </div>

        @if (accounts$ | async; as accounts) {
          <div class="space-y-3">
            @for (account of accounts; track account.id) {
              <button
                type="button"
                class="w-full rounded-lg border p-4 text-left transition"
                [class.border-blue-500]="account.id === (currentAccountId$ | async)"
                [class.bg-blue-50]="account.id === (currentAccountId$ | async)"
                [class.border-gray-200]="account.id !== (currentAccountId$ | async)"
                (click)="switchAccount(account.id)"
              >
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="font-semibold text-gray-900">
                      {{ account.email }}
                    </p>

                    <p class="mt-1 text-sm text-gray-500">
                      {{ account.status }}
                    </p>
                  </div>

                  @if (account.id === (currentAccountId$ | async)) {
                    <span class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      選択中
                    </span>
                  }
                </div>

                <div class="mt-2 text-sm">
                  @if (account.hasScanned) {
                    <span class="text-green-600">
                      スキャン済み
                    </span>
                  } @else {
                    <span class="text-amber-600">
                      未スキャン
                    </span>
                  }
                </div>
              </button>
            }
          </div>
        }
      </div>
      @if (currentAccount$ | async; as currentAccount) {
        <div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900">メールスキャン</h2>
          <p class="mt-6 text-lg text-gray-600">
            Gmailの受信トレイをスキャンして、登録先候補（メルマガ、支払い、アカウント等）を抽出します。
          </p>

          <button
            type="button"
            class="mt-8 w-full rounded-xl bg-blue-600 px-4 py-5 text-xl font-bold text-white transition hover:bg-blue-700"
            (click)="onScan()"
          >
            ↻ {{ currentAccount.hasScanned ? '再スキャン' : 'スキャン開始' }}
          </button>

          @if (currentAccount.hasScanned) {
            <a
              routerLink="/sources"
              class="mt-4 block w-full rounded-xl bg-gray-100 px-4 py-5 text-center text-xl font-bold text-gray-700 transition hover:bg-gray-200"
            >
              スキャン結果を見る（Sources画面へ）
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class AccountComponent {
    private accountService = inject(AccountService);

    accounts$ = this.accountService.accounts$;
    currentAccountId$ = this.accountService.currentAccountId$;
    currentAccount$ = combineLatest([
        this.accountService.accounts$,
        this.accountService.currentAccountId$,
    ]).pipe(
        map(([accounts, currentAccountId]) =>
            accounts.find((account) => account.id === currentAccountId)
        )
    );

    switchAccount(accountId: string): void {
        this.accountService.switchAccount(accountId);
    }
    onScan(): void {
        const account = this.accountService.getCurrentAccount();

        if (!account) {
            return;
        }

        this.accountService.markAsScanned(account.id);
    }
}
