import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, SidebarComponent],
    template: `
    <div class="flex h-screen bg-gray-50">
      <app-sidebar />

      <div class="flex flex-1 flex-col overflow-hidden">
        <app-header />

        <main class="flex-1 overflow-auto p-8">
          <router-outlet />
        </main>
      </div>
    </div>
    `,
})
export class LayoutComponent {}
