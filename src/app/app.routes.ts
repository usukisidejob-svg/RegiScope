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
];
