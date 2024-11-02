import {IonicModule} from '@ionic/angular';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ScannerRoutingModule} from './scanner-routing.module';
import {ScannerComponent} from './scanner.component';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ScannerRoutingModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  declarations: [ScannerComponent]
})
export class ScannerModule {
}
