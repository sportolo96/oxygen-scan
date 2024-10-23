import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './shared/services/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
  {
    path: 'main',
    loadChildren: () => import('./pages/main/main.module').then(m => m.MainModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'scanner',
    loadChildren: () => import('./pages/scanner/scanner.module').then(m => m.ScannerModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contact',
    loadChildren: () => import('./pages/contact/contact.module').then(m => m.ContactModule)
  },
  {
    path: 'not-found',
    loadChildren: () => import('./pages/not-found/not-found.module').then(m => m.NotFoundModule)
  },
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomeModule)
  },
  { path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule),
    canActivate: [AuthGuard]
  },
  { path: 'signup',
    loadChildren: () => import('./pages/signup/signup.module').then(m => m.SignupModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/not-found'
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
