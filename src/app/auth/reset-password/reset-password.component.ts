import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { HeaderTitleService } from "../../shared/services/headerTitle.service";
import { AlertController } from "@ionic/angular";
import { User } from "../../shared/models/User";

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
    'invalid-data': 'Nem megfelelő adatok.',
    'password-mismatch': 'A két jelszó nem egyezik.',
    'incorrect-old-password': 'Hibás régi jelszó.',
    'network-error': 'Hálózati hiba történt. Kérjük próbálja újra később.',
    'unexpected-error': 'Váratlan hiba történt. Kérjük próbálja újra.',
  };

  private readonly alerts = {
    'password-updated': ['Sikeres jelszócsere', 'A jelszavad sikeresen frissítve lett!'],
    'unexpected-error': ['Hiba történt', 'Kérjük próbálja újra később.'],
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private headerTitleService: HeaderTitleService,
    private alertController: AlertController,
  ) {
    this.headerTitleService.changeTitle('Jelszó módosítása');
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
      header: 'Figyelem!',
      message: messages.join(' '),
      buttons: ['OK']
    });
    await alert.present();
  }

  private setError(message: string): void {
    this.error = message;
  }
}
