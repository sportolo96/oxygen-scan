import {Component, ViewEncapsulation,AfterViewInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from './shared/services/auth.service';
import { filter } from 'rxjs/operators';
import {MatSidenav} from '@angular/material/sidenav';
import { LocalNotifications } from '@capacitor/local-notifications';

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
    { title: 'Profil', url: 'welcome', icon: 'supervised_user_circle', authRoute: null },
    { title: 'Mérés', url: 'scanner', icon: 'camera', authRoute: false },
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.scheduleNotification().then(r => console.log("alma"));
  }

  async scheduleNotification() {
    // Kérd az értesítési engedélyeket
    const permStatus = await LocalNotifications.requestPermissions();

    if (permStatus.display === 'granted') {
      // Ütemezz egy helyi értesítést egy perc késleltetéssel
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Push Notification',
            body: 'This is a test notification scheduled for 1 minute later',
            id: 1,
            schedule: {
              repeats: true,
              every: "day",
              at: new Date(new Date().setHours(11, 15, 0)),  // minden nap délben
            },
            sound: 'default',
            attachments: null,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } else {
      console.warn('User denied permissions for local notifications');
    }
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

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
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

  changePage(selectedPage: string) {
    //this.page = selectedPage;
    this.router.navigateByUrl(selectedPage);
  }

  onToggleSidenav(sidenav: MatSidenav) {
    sidenav.toggle();
  }

  onClose(event: any, sidenav: MatSidenav) {
    if (event === true) {
      sidenav.close();

    }
  }

  logout() {
    localStorage.removeItem('user');
    this.authService.logout();
    this.goToPage('login');
  }

  goToPage(pageName: string){
    this.router.navigate([`${pageName}`]);
  }

  ngAfterViewInit(): void {
  }
}
