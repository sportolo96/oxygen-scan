import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {RouterLink} from "@angular/router";
import {AuthRoutingModule} from "./auth-routing.module";
import {MatCheckbox} from "@angular/material/checkbox";
import {ResetPasswordComponent} from "./reset-password/reset-password.component";
import {TranslatePipe} from "@ngx-translate/core";

@NgModule({
  declarations: [
    RegisterComponent,
    LoginComponent,
    ResetPasswordComponent
  ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatButtonModule,
        MatInputModule,
        MatProgressSpinnerModule,
        RouterLink,
        AuthRoutingModule,
        MatCheckbox,
        TranslatePipe,
    ]
})
export class AuthModule {}
