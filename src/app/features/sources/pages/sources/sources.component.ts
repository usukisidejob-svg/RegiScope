import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountService } from '../../../../core/services/account.service';
import { SourceService } from '../../../../core/services/source.service';
import { AccountViewModel } from '../../../../models/account.model';
import { RegistrationSource } from '../../../../models/registration-source.model';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sources.component.html',
})
export class SourcesComponent implements OnInit {
  private accountService = inject(AccountService);
  private sourceService = inject(SourceService);
  private route = inject(ActivatedRoute);

  currentAccount = signal<AccountViewModel | undefined>(this.accountService.getCurrentAccount());
  sourcesSnapshot = signal<RegistrationSource[]>([]);
  isLoadingSources = signal(false);
  sourceLoadError = signal('');
  currentPage = signal(1);
  readonly pageSize = 5;

  get urgentCount(): number {
    return this.sourcesSnapshot().filter((source) => source.isUrgent).length;
  }

  selectedCategory: 'all' | 'newsletter' | 'payment' | 'account' | 'other' = 'all';

  categories = [
    { value: 'all', label: 'All' },
    { value: 'newsletter', label: 'メルマガ' },
    { value: 'payment', label: '支払い' },
    { value: 'account', label: 'アカウント' },
    { value: 'other', label: 'その他' },
  ] as const;

  selectedConfidence: 'all' | 'high' | 'medium' | 'low' = 'all';

  confidenceLevels = [
    { value: 'all', label: 'All' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ] as const;

  showUrgentOnly = false;

  selectedSort: 'lastSeenDesc' | 'confidenceDesc' | 'urgentFirst' = 'lastSeenDesc';

  sortOptions = [
    { value: 'lastSeenDesc', label: '新しい順' },
    { value: 'confidenceDesc', label: '信頼度順' },
    { value: 'urgentFirst', label: '緊急優先' },
  ] as const;

  selectedPeriod: 'all' | '1m' | '3m' | '6m' | '1y' = 'all';

  periodOptions = [
    { value: 'all', label: 'すべて' },
    { value: '1m', label: '直近1ヶ月' },
    { value: '3m', label: '直近3ヶ月' },
    { value: '6m', label: '半年' },
    { value: '1y', label: '1年' },
  ] as const;

  private getConfidenceScore(confidence: 'high' | 'medium' | 'low'): number {
    const scores = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return scores[confidence];
  }

  async ngOnInit(): Promise<void> {
    this.isLoadingSources.set(true);
    this.sourceLoadError.set('');

    try {
      const requestedAccountId = this.route.snapshot.queryParamMap.get('accountId');

      await this.accountService.loadAccounts();

      if (
        requestedAccountId &&
        this.accountService.getAccountsSnapshot().some((account) => account.id === requestedAccountId)
      ) {
        this.accountService.switchAccount(requestedAccountId);
      }

      this.currentAccount.set(this.accountService.getCurrentAccount());

      if (!this.currentAccount() || !this.currentAccount()?.hasScanned) {
        this.sourcesSnapshot.set([]);
        return;
      }

      await this.sourceService.loadSources(this.currentAccount()!.id);
      this.sourcesSnapshot.set(this.sourceService.getSourcesSnapshot());
    } catch {
      this.sourceLoadError.set('登録先候補の読み込みに失敗しました。backendが起動しているか確認してください。');
    } finally {
      this.isLoadingSources.set(false);
    }
  }

  get filteredSources() {
    const filtered = this.sourcesSnapshot().filter((source) => {
      if (this.selectedCategory !== 'all' && source.category !== this.selectedCategory) {
        return false;
      }

      if (this.selectedConfidence !== 'all' && source.confidence !== this.selectedConfidence) {
        return false;
      }

      if (this.showUrgentOnly && !source.isUrgent) {
        return false;
      }

      if (!this.isWithinSelectedPeriod(source.lastSeen)) {
        return false;
      }

      if (!this.matchesSearchQuery(source)) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (this.selectedSort === 'lastSeenDesc') {
        return b.lastSeen.getTime() - a.lastSeen.getTime();
      }

      if (this.selectedSort === 'confidenceDesc') {
        return this.getConfidenceScore(b.confidence) - this.getConfidenceScore(a.confidence);
      }

      if (this.selectedSort === 'urgentFirst') {
        return Number(b.isUrgent) - Number(a.isUrgent);
      }

      return 0;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSources.length / this.pageSize));
  }

  get paginatedSources(): RegistrationSource[] {
    this.ensureCurrentPageInRange();

    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSources.slice(startIndex, startIndex + this.pageSize);
  }

  get pageStartItem(): number {
    if (this.filteredSources.length === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  get pageEndItem(): number {
    return Math.min(this.currentPage() * this.pageSize, this.filteredSources.length);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];

    for (let page = 1; page <= this.totalPages; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  goToPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 1), this.totalPages);
    this.currentPage.set(nextPage);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  private ensureCurrentPageInRange(): void {
    if (this.currentPage() > this.totalPages) {
      this.currentPage.set(this.totalPages);
    }
  }

  private isWithinSelectedPeriod(date: Date): boolean {
    if (this.selectedPeriod === 'all') {
      return true;
    }

    const now = new Date();
    const threshold = new Date(now);

    if (this.selectedPeriod === '1m') {
      threshold.setMonth(now.getMonth() - 1);
    }

    if (this.selectedPeriod === '3m') {
      threshold.setMonth(now.getMonth() - 3);
    }

    if (this.selectedPeriod === '6m') {
      threshold.setMonth(now.getMonth() - 6);
    }

    if (this.selectedPeriod === '1y') {
      threshold.setFullYear(now.getFullYear() - 1);
    }

    return date >= threshold;
  }

  private matchesSearchQuery(source: RegistrationSource): boolean {
    const query = this.sourceService.searchQuery().trim().toLowerCase();

    if (!query) {
      return true;
    }

    const searchableText = [
      source.displayName,
      source.domain,
      source.senderEmail,
      source.category,
      source.confidence,
      this.getFrequencyLabel(source),
    ].join(' ').toLowerCase();

    return searchableText.includes(query);
  }

  getFrequencyLabel(source: RegistrationSource): string {
    const patternLabels = {
      daily: '毎日',
      weekly: '週次',
      monthly: '月次',
    };

    if (source.frequency.pattern) {
      return patternLabels[source.frequency.pattern];
    }

    return `${source.frequency.period}日間で${source.frequency.count}回`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  getGmailSearchUrl(source: RegistrationSource): string {
    return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(
      this.getGmailSearchQuery(source),
    )}`;
  }

  private getGmailSearchQuery(source: RegistrationSource): string {
    const urgentQuery = '{overdue failed suspended "action required" urgent 至急 失敗 停止 要対応}';

    if (source.gmailQuery) {
      if (source.isUrgent) {
        return `${source.gmailQuery} ${urgentQuery}`;
      }

      return source.gmailQuery;
    }

    const baseQuery = `from:${source.senderEmail} newer_than:2y`;

    if (source.isUrgent) {
      return `${baseQuery} ${urgentQuery}`;
    }

    if (source.category === 'payment') {
      return `${baseQuery} {invoice receipt payment billing subscription}`;
    }

    if (source.category === 'account') {
      return `${baseQuery} {verify verification security login password}`;
    }

    if (source.category === 'newsletter') {
      return `${baseQuery} {unsubscribe newsletter}`;
    }

    return baseQuery;
  }
}
