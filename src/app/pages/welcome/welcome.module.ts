import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome.component';
import { WelcomeRoutingModule } from './welcome-routing.module';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import { IonicModule } from '@ionic/angular';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    WelcomeComponent
  ],
    imports: [
        CommonModule,
        IonicModule.forRoot(), // Import Ionic module here
        WelcomeRoutingModule,
        MatButtonModule,
        MatTableModule,
        MatProgressSpinnerModule
    ]
})
export class WelcomeModule { }
