import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SourceService } from '../../../core/services/source.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './header.component.html',
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
