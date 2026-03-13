import { Routes } from '@angular/router';

export const GAME_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./game-layout.component').then((c) => c.GameLayoutComponent),
    },
    {
        path: 'boost',
        loadComponent: () =>
            import('./components/energy-boost/boost/boost.component').then((c) => c.BoostComponent),
    },
    {
        path: 'box',
        loadComponent: () =>
            import('../mini-games/box/box.component').then((c) => c.BoxComponent),
    },
    {
        path: 'ticket',
        loadComponent: () =>
            import('../mini-games/ticket-roulette/ticket-roulette.component').then((c) => c.TicketRouletteComponent),
    },
];

