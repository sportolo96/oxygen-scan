import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';
import { HeaderTitleService } from "../../shared/services/headerTitle.service";
import { AlertController } from "@ionic/angular";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  signUpForm: FormGroup;
  loading = false;
  error: string | null = null;

  private readonly errors = {
    'auth/too-many-requests': this.translateService.instant('to_many_request'),
    'auth/invalid-credential': this.translateService.instant('not_correct_email_or_password'),
    'auth/invalid-email': this.translateService.instant('incorrect_email'),
    'auth/email-already-in-use': this.translateService.instant('email_already_in_use'),
    'invalid-data': this.translateService.instant('not_valid_data'),
  };

  private readonly alerts = {
    'registration-success': [this.translateService.instant('success_registration_title'), this.translateService.instant('success_registration_longer_text')],
    'unexpected-error': [this.translateService.instant('failed_process_title'), this.translateService.instant('failed_process_try_again')],
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private headerTitleService: HeaderTitleService,
    private alertController: AlertController,
    private translateService: TranslateService,
  ) {
    this.headerTitleService.changeTitle(this.translateService.instant('registration'));
    this.signUpForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      rePassword: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    const user: User = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.email) {
      this.router.navigateByUrl('/home');
    }
  }

  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.setError(this.errors['invalid-data']);
      return;
    }

    this.loading = true;
    const { email, password } = this.signUpForm.value;

    this.authService.signup(email, password)
      .then(credentials => {
        const user: User = {
          uid: credentials.user?.uid as string,
          email,
          hasProfilePicture: false,
        };
        this.userService.create(user)
          .then(() => {
            this.loading = false;
            this.authService.logout();
            this.presentAlert(this.alerts['registration-success']);
            this.router.navigateByUrl('/auth/login');
          })
          .catch(err => {
            this.setError(this.errors[err.code]);
            this.loading = false;
          });
      })
      .catch(err => {
        this.setError(this.errors[err.code]);
        this.loading = false;
      });
  }

  async presentAlert(messages: string[]): Promise<void> {
    const alert = await this.alertController.create({
      header: messages[0],
      message: messages[1],
      buttons: ['OK'],
    });
    await alert.present();
  }

  private setError(message: string): void {
    this.error = message;
  }
}
