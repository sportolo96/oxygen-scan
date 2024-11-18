import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { User } from "../../shared/models/User";
import { HeaderTitleService } from "../../shared/services/headerTitle.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public loading = false;
  public error: string | null = null;
  public signInForm: FormGroup;

  private readonly errors = {
    'auth/too-many-requests': 'Túl sok bejelentkezési kísérlet.',
    'auth/invalid-credential': 'Nem megfelelő email-jelszó páros.',
    'auth/invalid-email': 'Nem megfelelő email.',
    'invalid-data': 'Nem megfelelő adatok.',
    'default': 'Ismeretlen hiba történt.'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.changeTitle('Bejelentkezés');
  }

  ngOnInit(): void {
    this.redirectIfLoggedIn();
    this.initializeSignInForm();
  }

  private redirectIfLoggedIn(): void {
    const user = this.getUserFromLocalStorage();
    if (user?.uid) {
      this.router.navigateByUrl('/home');
    }
  }

  private getUserFromLocalStorage(): User | null {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  private initializeSignInForm(): void {
    const rememberedEmail = localStorage.getItem('email') || '';
    this.signInForm = new FormGroup({
      email: new FormControl(rememberedEmail, [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      rememberMe: new FormControl(false),
    });
  }

  async onSubmit(): Promise<void> {
    if (this.signInForm.invalid) {
      return;
    }

    this.loading = true;
    this.handleRememberMe();

    const { email, password } = this.signInForm.value;

    if (!email || !password) {
      this.setError(this.errors['invalid-data']);
      this.loading = false;
      return;
    }

    try {
      const userCredential = await this.authService.login(email, password);
      this.handleLoginSuccess(userCredential);
    } catch (err) {
      this.handleLoginError(err);
    } finally {
      this.loading = false;
    }
  }

  private handleRememberMe(): void {
    if (this.signInForm.controls['rememberMe'].value) {
      localStorage.setItem('email', this.signInForm.controls['email'].value);
    } else {
      localStorage.removeItem('email');
    }
  }

  private handleLoginSuccess(userCredential: any): void {
    if (userCredential?.user) {
      localStorage.setItem('user', JSON.stringify(userCredential.user));
      this.router.navigateByUrl('/home');
    }
  }

  private handleLoginError(err: any): void {
    const errorMessage = this.errors[err.code] || this.errors['default'];
    this.setError(errorMessage);
  }

  private setError(message: string): void {
    this.error = message;
  }
}
