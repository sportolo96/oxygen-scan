import {Component} from '@angular/core';
import {HeaderTitleService} from "../shared/services/headerTitle.service";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {

  constructor(
    private headerTitleService: HeaderTitleService,
    private translateService: TranslateService,
  ) {
    this.headerTitleService.changeTitle('404 -' + this.translateService.instant('page_not_found'));
  }
}
