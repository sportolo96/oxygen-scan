import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome.component';
import { WelcomeRoutingModule } from './welcome-routing.module';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';

@NgModule({
  declarations: [
    WelcomeComponent
  ],
    imports: [
        CommonModule,
        WelcomeRoutingModule,
        MatButtonModule,
        MatTableModule
    ]
})
export class WelcomeModule { }
