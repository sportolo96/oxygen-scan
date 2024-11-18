import {Component, ViewEncapsulation, AfterViewInit, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from './shared/services/auth.service';
import {filter} from 'rxjs/operators';
import {LocalNotifications} from '@capacitor/local-notifications';
import {HeaderTitleService} from "./shared/services/headerTitle.service";
import {Capacitor} from "@capacitor/core";
import {StatusBar, Style} from "@capacitor/status-bar";

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

export class AppComponent implements AfterViewInit, OnInit {
  page = '';
  headerTitle: string;
  routes: Array<string> = [];
  loggedInUser?: firebase.default.User | null;
  appPages = [
    {title: 'Előzmények', url: 'history', icon: 'dns', authRoute: true},
    {title: 'Mérés', url: 'scanner', icon: 'camera', authRoute: null},
    {title: 'Profil', url: 'home', icon: 'supervised_user_circle', authRoute: null},
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private headerTitleService: HeaderTitleService
  ) {
    this.initializePushNotifications();
    this.initializeLocalNotificationListeners();
    if (Capacitor.isPluginAvailable('StatusBar')) {
      StatusBar.setStyle({ style: Style.Default });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
    }
  }

  initializeLocalNotificationListeners() {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed', notification);
      this.router.navigate(['/scanner']);
    });
  }

  initializePushNotifications() {
  }

  getPages() {
    return this.appPages.filter(menuItem => {
      if (menuItem.authRoute == null) {
        return true;
      }

      if (!this.loggedInUser) {
        return menuItem.authRoute === true;
      }

      return menuItem.authRoute === false;
    })
  }

  ngOnInit() {
    this.headerTitleService.currentHeaderTitle.subscribe((title: string) => {
      this.headerTitle = title;
    });

    this.routes = this.router.config.map(conf => conf.path) as string[];

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((evts: any) => {
      const currentPage = (evts.urlAfterRedirects as string).split('/')[1] as string;
      if (this.routes.includes(currentPage)) {
        this.page = currentPage;
      }
    });

    this.authService.isUserLoggedIn().subscribe({
      next: (user) => {
        this.loggedInUser = user;
        localStorage.setItem('user', JSON.stringify(this.loggedInUser));
      },
      error: (error) => {
        console.error(error);
        localStorage.setItem('user', JSON.stringify('null'));
      }
    });
  }

  ngAfterViewInit(): void {
    console.log("ngAfterViewInit");
  }
}
