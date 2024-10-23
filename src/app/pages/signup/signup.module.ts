import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignupRoutingModule } from './signup-routing.module';
import { SignupComponent } from './signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@NgModule({
  declarations: [
    SignupComponent
  ],
    imports: [
        CommonModule,
        SignupRoutingModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatButtonModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ]
})
export class SignupModule { }
