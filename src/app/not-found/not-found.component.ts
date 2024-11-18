import {Component} from '@angular/core';
import {HeaderTitleService} from "../shared/services/headerTitle.service";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {

  constructor(
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.changeTitle('404 - Nem található');
  }
}
