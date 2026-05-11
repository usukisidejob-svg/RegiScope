import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { AccountService } from '../../../../core/services/account.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit {
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  accounts$ = this.accountService.accounts$;
  currentAccountId$ = this.accountService.currentAccountId$;
  isAddingAccount = false;
  isLoadingAccounts = false;
  accountLoadError = '';
  isScanning = false;
  scanError = '';
  scanNeedsReauth = false;
  disconnectError = '';
  pendingDisconnectAccountId: string | null = null;

  currentAccount$ = combineLatest([
    this.accountService.accounts$,
    this.accountService.currentAccountId$,
  ]).pipe(
    map(([accounts, currentAccountId]) =>
      accounts.find((account) => account.id === currentAccountId)
    )
  );

  switchAccount(accountId: string): void {
    if (this.isScanning) {
      return;
    }

    this.accountService.switchAccount(accountId);
  }

  requestDisconnectAccount(accountId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isScanning) {
      return;
    }

    this.disconnectError = '';
    this.pendingDisconnectAccountId = accountId;
  }

  cancelDisconnectAccount(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.pendingDisconnectAccountId = null;
  }

  async confirmDisconnectAccount(accountId: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (this.isScanning) {
      return;
    }

    this.disconnectError = '';

    try {
      await this.accountService.disconnectAccount(accountId);
      this.pendingDisconnectAccountId = null;
    } catch {
      this.disconnectError = 'Gmailアカウントの接続解除に失敗しました。時間をおいて再度お試しください。';
    }
  }

  showAddAccountForm(): void {
    this.isAddingAccount = true;
  }

  cancelAddAccount(): void {
    this.isAddingAccount = false;
  }

  async connectGoogleAccount(): Promise<void> {
    try {
      await this.accountService.connectGoogleAccount();
      this.cancelAddAccount();
    } catch {
      this.accountLoadError = 'Google認証URLの取得に失敗しました。時間をおいて再度お試しください。';
    }
  }

  async onScan(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    const account = this.accountService.getCurrentAccount();

    if (!account) {
      return;
    }

    this.isScanning = true;
    this.scanError = '';
    this.scanNeedsReauth = false;

    try {
      await this.accountService.markAsScanned(account.id);
      await this.router.navigate(['/sources'], {
        queryParams: {
          accountId: account.id,
        },
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'スキャンに失敗しました。時間をおいて再度お試しください。';

      this.scanError = message;
      this.scanNeedsReauth = message.includes('再認証');
    } finally {
      this.isScanning = false;
    }
  }

  async ngOnInit(): Promise<void> {
    const connectedEmail = this.route.snapshot.queryParamMap.get('connectedEmail');

    this.isLoadingAccounts = true;
    this.accountLoadError = '';

    try {
      await this.accountService.loadAccounts(connectedEmail ?? undefined);
    } catch {
      this.accountLoadError = 'アカウント一覧の読み込みに失敗しました。backendが起動しているか確認してください。';
    } finally {
      this.isLoadingAccounts = false;
    }

    if (!connectedEmail) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }
}
