import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotFoundRoutingModule } from './not-found-routing.module';
import { NotFoundComponent } from './not-found.component';
import {TranslatePipe} from "@ngx-translate/core";


@NgModule({
  declarations: [
    NotFoundComponent
  ],
    imports: [
        CommonModule,
        NotFoundRoutingModule,
        TranslatePipe
    ]
})
export class NotFoundModule { }
