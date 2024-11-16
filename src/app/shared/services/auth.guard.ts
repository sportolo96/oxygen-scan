import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate, Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      const user = JSON.parse(localStorage.getItem('user') as string);

      if (user && route.url[0].path !== 'login' && route.url[0].path !== 'signup') {
        return true;
      } else if (!user && (route.url[0].path === 'login' || route.url[0].path === 'signup' || route.url[0].path === 'welcome' || route.url[0].path === 'scanner')) {
        return true;
      } else if (!user && (route.url[0].path !== 'login' && route.url[0].path !== 'signup' && route.url[0].path !== 'welcome' && route.url[0].path !== 'scanner')) {
        this.router.navigate(['/login']);
        return true;
      }else if (user && (route.url[0].path === 'login' || route.url[0].path === 'signup')) {
        this.router.navigate(['/welcome']);
        return true;
      }
      return false;
  }

}
