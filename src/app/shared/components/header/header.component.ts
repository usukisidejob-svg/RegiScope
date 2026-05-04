import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SourceService } from '../../../core/services/source.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (showSearch$ | async) {
      <header class="border-b border-gray-200 bg-white px-6 py-4">
        <form class="mx-auto flex max-w-2xl gap-2" (submit)="applySearch($event)">
          <input
            type="text"
            [value]="searchText"
            (input)="onSearchInput($event)"
            (focus)="showSearchButton = true"
            placeholder="送信元 / ドメイン / 件名で検索"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          @if (showSearchButton || searchText) {
            <button
              type="submit"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              検索
            </button>
          }
        </form>
      </header>
    }
  `,
})
export class HeaderComponent {
  private router = inject(Router);
  private sourceService = inject(SourceService);

  searchText = this.sourceService.searchQuery();
  showSearchButton = false;

  showSearch$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => this.router.url.startsWith('/sources'))
  );

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
    this.sourceService.setSearchQuery(this.searchText);
  }

  applySearch(event: Event): void {
    event.preventDefault();
    this.sourceService.setSearchQuery(this.searchText);
  }
}
