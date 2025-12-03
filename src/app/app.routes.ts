import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { superadminGuard } from './guards/superadmin.guard';

export const routes: Routes = [
  // {
  //   path: '',
  //   loadChildren: () => import('./modules/homepage/homepage-module').then(m => m.HomepageModule),
  //   title: 'Nepal Visual - Geographic & School Mapping'
  // },
  {
    path: '',
    loadChildren: () => import('./modules/voter-list/voter-list-module').then(m => m.VoterListModule),
    title: 'Nepal Visual - Geographic & School Mapping',
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login').then(m => m.Login),
    title: 'Login - Nepal Visual'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./modules/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
    title: 'Forgot Password - Nepal Visual'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./modules/auth/reset-password/reset-password').then(m => m.ResetPassword),
    title: 'Reset Password - Nepal Visual'
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./modules/auth/user-management/user-management').then(m => m.UserManagement),
    title: 'User Management - Nepal Visual',
    canActivate: [superadminGuard]
  },
  // {
  //   path: 'home',
  //   redirectTo: '',
  //   pathMatch: 'full'
  // },
  {
    path: '**',
    redirectTo: ''
  }
];
