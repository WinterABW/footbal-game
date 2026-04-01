import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadComponent: () => import('./features/auth/welcome.component').then((m) => m.WelcomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'main',
    canActivate: [authGuard],
    loadChildren: () => import('./features/game/game.routes').then((m) => m.GAME_ROUTES),
  },
  {
    path: 'mining',
    canActivate: [authGuard],
    loadComponent: () => import('./features/invest/invest-layout.component').then((c) => c.InvestLayoutComponent),
  },
  {
    path: 'social',
    canActivate: [authGuard],
    loadComponent: () => import('./features/social/social.component').then((c) => c.SocialComponent),
  },
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wallet/wallet.component').then((c) => c.WalletComponent),
  },
  {
    path: 'mociones',
    canActivate: [authGuard],
    loadComponent: () => import('./features/motions/motions.component').then((c) => c.MotionsComponent),
  },
  {
    path: 'transaccion',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wallet/transaction/transaction.component').then((c) => c.TransactionComponent),
  },
];
