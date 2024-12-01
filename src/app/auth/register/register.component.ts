import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';
import { HeaderTitleService } from "../../shared/services/headerTitle.service";
import { AlertController } from "@ionic/angular";

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
    'auth/too-many-requests': 'Túl sok bejelentkezési kísérlet.',
    'auth/invalid-credential': 'Nem megfelelő email-jelszó páros.',
    'auth/invalid-email': 'Nem megfelelő email.',
    'auth/email-already-in-use': 'Az email már használatban van.',
    'invalid-data': 'Nem megfelelő adatok.',
  };

  private readonly alerts = {
    'registration-success': ['Sikeres regisztráció!', 'A regisztrációs folyamat sikeresen befejeződött.'],
    'unexpected-error': ['Hiba történt', 'Kérjük próbálja újra később.'],
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private headerTitleService: HeaderTitleService,
    private alertController: AlertController,
  ) {
    this.headerTitleService.changeTitle('Regisztráció');
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
      header: 'Figyelem!',
      buttons: ['OK'],
    });
    await alert.present();
  }

  private setError(message: string): void {
    this.error = message;
  }
}
