import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private isOnlineSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    Network.getStatus().then(status => {
      this.isOnlineSubject.next(status.connected);
    });

    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      this.isOnlineSubject.next(status.connected);
    });
  }

  get isOnline() {
    return this.isOnlineSubject.asObservable();
  }
}
