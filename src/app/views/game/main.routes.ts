import { Routes } from '@angular/router';

export const MAIN_ROUTES: Routes = [
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
        path: 'wheel',
        loadComponent: () =>
            import('./components/lucky-wheel/lucky-wheel.component').then((c) => c.LuckyWheelComponent),
    },
    {
        path: 'ruleta',
        loadComponent: () =>
            import('./components/ruleta/ruleta-futbol-elite.component').then((c) => c.RuletaFutbolEliteComponent),
    },
];
