import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="border-b border-gray-200 bg-white px-6 py-4">
      <div class="mx-auto max-w-2xl">
        <input
          type="text"
          placeholder="送信元 / ドメイン / 件名で検索"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </header>
  `,
})
export class HeaderComponent {}