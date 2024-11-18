import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeComponent} from './home.component';
import {HomeRoutingModule} from './home-routing.module';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AuthService} from "../shared/services/auth.service";
import {ImageService} from "../shared/services/image.service";

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    IonicModule.forRoot(), // Import Ionic module here
    HomeRoutingModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  providers: [ImageService, AuthService],
})
export class HomeModule {
}
