import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AccountViewModel } from '../../models/account.model';
import { MOCK_ACCOUNTS } from '../constants/mock-data';

@Injectable({
    providedIn: 'root',
})
export class AccountService {

    // アカウント一覧の状態管理【state】
    private accountsSubject = new BehaviorSubject<AccountViewModel[]>(MOCK_ACCOUNTS);

    // コンポーネントが購読するためのObservable
    accounts$ = this.accountsSubject.asObservable();

    // 現在選択中のアカウントIDを管理【state】
    private currentAccountIdSubject = new BehaviorSubject<string>(MOCK_ACCOUNTS[0].id);

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
     * Google認証でGmailアカウントを接続する
     * 開発中は認証後に取得するメールアドレスをモックで作成する
     */
    connectGoogleAccount(): void {
        const accountNumber = this.accountsSubject.value.length + 1;
        const email = `connected.${accountNumber}@gmail.com`;
        const newAccount: AccountViewModel = {
            id: `account-${Date.now()}`,
            email,
            displayName: email,
            isActive: true,
            hasScanned: false,
            createdAt: new Date(),
            status: 'connected',
        };

        this.accountsSubject.next([...this.accountsSubject.value, newAccount]);
        this.switchAccount(newAccount.id);
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
            ?{
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
}
