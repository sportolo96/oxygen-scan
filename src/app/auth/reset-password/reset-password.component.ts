import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { HeaderTitleService } from "../../shared/services/headerTitle.service";
import { AlertController } from "@ionic/angular";
import { User } from "../../shared/models/User";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-reset',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  resetForm: FormGroup;
  loading = false;
  error: string | null = null;

  private readonly errors = {
    'invalid-data': this.translateService.instant('invalid_data'),
    'password-mismatch':  this.translateService.instant('password_mismatch'),
    'incorrect-old-password': this.translateService.instant('incorrect_old_password'),
    'network-error': this.translateService.instant('network_error'),
    'unexpected-error': this.translateService.instant('unexpected_error'),
  };

  private readonly alerts = {
    'password-updated': [this.translateService.instant('success_password_update_title'), this.translateService.instant('success_password_longer_text')],
    'unexpected-error': [this.translateService.instant('failed_process_title'), this.translateService.instant('failed_process_try_again')],
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private headerTitleService: HeaderTitleService,
    private alertController: AlertController,
    private translateService: TranslateService,
  ) {
    this.headerTitleService.changeTitle(this.translateService.instant('update_password'));
    this.resetForm = new FormGroup({
      oldPassword: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      rePassword: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    const user: User = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.uid) {
      this.router.navigateByUrl('/home');
    }
  }

  onSubmit(): void {
    if (!this.resetForm.valid) {
      return;
    }

    const { oldPassword, password, rePassword } = this.resetForm.value;

    if (password !== rePassword) {
      this.setError(this.errors['password-mismatch']);
      return;
    }

    this.loading = true;

    this.authService.checkPassword(oldPassword)
      .then(isPasswordValid => {
        if (!isPasswordValid) {
          this.setError(this.errors['incorrect-old-password']);
          this.loading = false;
          return;
        }

        this.authService.updatePassword(password)
          .then(() => {
            this.loading = false;
            this.presentAlert(this.alerts['password-updated']);
            this.router.navigate(['/home']);
          })
          .catch(error => {
            this.loading = false;
            console.error('Error during password update:', error);
            this.setError(this.errors['unexpected-error']);
          });
      })
      .catch(error => {
        this.loading = false;
        console.error('Error during password check:', error);
        if (error.code === 'auth/network-request-failed') {
          this.setError(this.errors['network-error']);
        } else {
          this.setError(this.errors['unexpected-error']);
        }
      });
  }

  async presentAlert(messages: string[]): Promise<void> {
    const alert = await this.alertController.create({
      header: messages[0],
      message: messages[1],
      buttons: ['OK']
    });
    await alert.present();
  }

  private setError(message: string): void {
    this.error = message;
  }
}
