import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HistoryRoutingModule } from './history-routing.module';
import { HistoryComponent } from './history.component';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatProgressSpinner} from "@angular/material/progress-spinner";


@NgModule({
  declarations: [
    HistoryComponent
  ],
    imports: [
        CommonModule,
        HistoryRoutingModule,
        MatButtonModule,
        MatTableModule,
        MatProgressSpinner
    ]
})
export class HistoryModule { }
