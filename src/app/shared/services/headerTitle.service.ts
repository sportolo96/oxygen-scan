import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class HeaderTitleService {
  private headerTitleSource = new BehaviorSubject<string>('OxygenScan');
  currentHeaderTitle = this.headerTitleSource.asObservable();

  changeTitle(title: string) {
    this.headerTitleSource.next(title);
  }
}
