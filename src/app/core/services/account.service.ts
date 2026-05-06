import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AccountViewModel } from '../../models/account.model';

type ApiAccount = {
    id: string;
    email: string;
    displayName: string | null;
    googleUserId: string | null;
    hasScanned: boolean;
    lastScanDate: string | null;
    createdAt: string;
    updatedAt: string;
};

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    private readonly apiBaseUrl = 'http://localhost:3000';

    // アカウント一覧の状態管理【state】
    private accountsSubject = new BehaviorSubject<AccountViewModel[]>([]);

    // コンポーネントが購読するためのObservable
    accounts$ = this.accountsSubject.asObservable();

    // 現在選択中のアカウントIDを管理【state】
    private currentAccountIdSubject = new BehaviorSubject<string | null>(null);


    // 現在選択中のアカウントIDのObservable
    currentAccountId$ = this.currentAccountIdSubject.asObservable();

    /**
     * 【getter】
     * 現在のアカウント一覧を同期的に取得
     * 主に内部処理や一時的な参照で使用
     */
    getAccountsSnapshot(): AccountViewModel[] {
        return this.accountsSubject.value;
    }
    /**
     * 【getter】
     * 現在選択中のアカウントの取得
     * UI表示や処理対象アカウントの特定に使用
     */
    getCurrentAccount(): AccountViewModel | undefined {
        const currentId = this.currentAccountIdSubject.value;

        if (!currentId) {
            return undefined;
        }

        return this.accountsSubject.value.find((account) => account.id === currentId);
    }


    /**
     * 【action】
     * アカウントを切り替える
     * Account画面やSidebarでの選択時に使用
     */
    switchAccount(accountId: string): void {
        this.currentAccountIdSubject.next(accountId);
    }

    /**
     * 【action】
     * Google認証画面へ遷移する
     * 認証後のアカウント保存はbackend callbackで行う
     */
    async connectGoogleAccount(): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/api/auth/google/url`);

        if (!response.ok) {
            throw new Error('Failed to get Google auth URL.');
        }

        const data = (await response.json()) as { authUrl: string };

        window.location.href = data.authUrl;
    }


    /**
     * 【action】
     * スキャン完了状態に更新する
     * スキャン処理完了後に呼び出す
     * → hasScanned = true によってSource画面が有効化される
     */
    markAsScanned(accountId: string): void {
        const updatedAccounts = this.accountsSubject.value.map((account) =>
            account.id === accountId
                ? {
                    ...account,
                    hasScanned: true,
                    lastScanDate: new Date(),
                }
                : account
        );
        this.accountsSubject.next(updatedAccounts);
    }

    /**
     * 【getter】
     * 現在のアカウントがスキャン済みかどうか判定
     * Sidebarや制御画面で使用
     */
    hasCurrentAccountScanned(): boolean {
        return this.getCurrentAccount()?.hasScanned ?? false;
    }

    async loadAccounts(selectedEmail?: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/api/accounts`);

        if (!response.ok) {
            throw new Error('Failed to load accounts.');
        }

        const accounts = (await response.json()) as ApiAccount[];

        const viewModels: AccountViewModel[] = accounts.map((account) => ({
            id: account.id,
            email: account.email,
            displayName: account.displayName ?? account.email,
            isActive: true,
            hasScanned: account.hasScanned,
            lastScanDate: account.lastScanDate ? new Date(account.lastScanDate) : undefined,
            createdAt: new Date(account.createdAt),
            status: 'connected',
        }));

        this.accountsSubject.next(viewModels);

        if (viewModels.length === 0) {
            this.currentAccountIdSubject.next(null);
            return;
        }

        const selectedAccount = selectedEmail
            ? viewModels.find((account) => account.email === selectedEmail)
            : undefined;

        this.switchAccount(selectedAccount?.id ?? viewModels[0].id);
    }

}
