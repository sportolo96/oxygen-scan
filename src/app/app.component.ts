import {Component, ViewEncapsulation,AfterViewInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from './shared/services/auth.service';
import { filter } from 'rxjs/operators';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Timer {
  time: string;
  notificationId: number | null;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class AppComponent implements AfterViewInit{
  title = 'Massage';
  page = '';
  routes: Array<string> = [];
  loggedInUser?: firebase.default.User | null;
  appPages = [
    { title: 'Előzmények', url: 'main', icon: 'dns', authRoute: null },
    { title: 'Mérés', url: 'scanner', icon: 'camera', authRoute: null },
    { title: 'Profil', url: 'welcome', icon: 'supervised_user_circle', authRoute: null },
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.initializePushNotifications();
    this.initializeLocalNotificationListeners();
  }

  initializeLocalNotificationListeners() {
    // Kattintás esemény kezelése a helyi értesítésekre
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed', notification);
      // Navigálás a scanner oldalra
      this.router.navigate(['/scanner']);
    });
  }

  initializePushNotifications() {
    // A push értesítések inicializálása (ha szükséges)
    // Itt tedd hozzá a push értesítések kezelését
  }

  getPages() {
    return this.appPages.filter(menuItem => {
      if(menuItem.authRoute == null) {
        return true;
      }

      if(!this.loggedInUser) {
        return menuItem.authRoute === true;
      }

      return menuItem.authRoute === false;
    })
  }

  ngOnInit() {
    // fat-arrow
    this.routes = this.router.config.map(conf => conf.path) as string[];

    // rxjs - reaktív programozás
    // subscribe
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((evts: any) => {
      const currentPage = (evts.urlAfterRedirects as string).split('/')[1] as string;
      if (this.routes.includes(currentPage)) {
        this.page = currentPage;
      }
    });
    this.authService.isUserLoggedIn().subscribe(user => {
      this.loggedInUser = user;
      localStorage.setItem('user', JSON.stringify(this.loggedInUser));
    }, error => {
      console.error(error);
      localStorage.setItem('user', JSON.stringify('null'));
    });
  }

  ngAfterViewInit(): void {
    console.log("ngAfterViewInit");
  }
}
