import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'account',
        pathMatch: 'full',
    },
    {
        path: 'account',
        loadComponent: () =>
            import('./features/account/pages/account/account.component')
                .then((m) => m.AccountComponent),
    },
    {
        path: 'sources',
        loadComponent: () =>
            import('./features/sources/pages/sources/sources.component')
                .then((m) => m.SourcesComponent),
    },
];
