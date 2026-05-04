import { Component, inject } from '@angular/core';
import { AccountService } from '../../../../core/services/account.service';
import { SourceService } from '../../../../core/services/source.service';

@Component({
  selector: 'app-sources',
  standalone: true,
  template: `
    <section class="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Sources</h1>
        <p class="mt-2 text-gray-600">登録先候補の一覧</p>
      </div>

      @if (currentAccount) {
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p class="text-sm text-blue-700">スキャン対象アカウント</p>
          <p class="mt-1 font-semibold text-blue-900">
            {{ currentAccount.email }}
          </p>
        </div>
      }
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="mb-3 text-sm font-semibold text-gray-700">カテゴリ</p>

        <div class="flex flex-wrap gap-2">
          @for (category of categories; track category.value) {
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-medium transition"
              [class.bg-blue-600]="selectedCategory === category.value"
              [class.text-white]="selectedCategory === category.value"
              [class.bg-gray-100]="selectedCategory !== category.value"
              [class.text-gray-700]="selectedCategory !== category.value"
              (click)="selectedCategory = category.value"
            >
              {{ category.label }}
            </button>
          }
        </div>
        <div class="mt-5">
          <p class="mb-3 text-sm font-semibold text-gray-700">信頼度</p>

          <div class="flex flex-wrap gap-2">
            @for (confidence of confidenceLevels; track confidence.value) {
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium transition"
                [class.bg-blue-600]="selectedConfidence === confidence.value"
                [class.text-white]="selectedConfidence === confidence.value"
                [class.bg-gray-100]="selectedConfidence !== confidence.value"
                [class.text-gray-700]="selectedConfidence !== confidence.value"
                (click)="selectedConfidence = confidence.value"
              >
                {{ confidence.label }}
              </button>
            }
          </div>
        </div>
      </div>

      @if (urgentCount > 0) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          至急対応: {{ urgentCount }}件
        </div>
      }

      <div class="space-y-3">
        @for (source of filteredSources; track source.id) {
          <article class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="font-semibold text-gray-900">
                  {{ source.displayName }}
                </h2>
                <p class="text-sm text-gray-500">
                  {{ source.domain }}
                </p>
              </div>

              <div class="flex gap-2 text-sm">
                <span class="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                  {{ source.category }}
                </span>
                <span class="rounded-full bg-green-100 px-2 py-1 text-green-700">
                  {{ source.confidence }}
                </span>
              </div>
            </div>

            @if (source.isUrgent) {
              <p class="mt-3 text-sm font-medium text-red-600">至急対応</p>
            }
          </article>
        } @empty {
          <div class="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
            このアカウントの登録先候補はまだありません。
          </div>
        }
      </div>
    </section>
  `,
})
export class SourcesComponent {
  private accountService = inject(AccountService);
  private sourceService = inject(SourceService);

  currentAccount = this.accountService.getCurrentAccount();

  sources = this.currentAccount
    ? this.sourceService.getSourcesByAccountId(this.currentAccount.id)
    : [];

  urgentCount = this.sources.filter((source) => source.isUrgent).length;

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

  get filteredSources() {
    return this.sources.filter((source) => {
      if (this.selectedCategory !== 'all' && source.category !== this.selectedCategory) {
        return false;
      }

      if (this.selectedConfidence !== 'all' && source.confidence !== this.selectedConfidence) {
        return false;
      }

      return true;
    });
  }
}
