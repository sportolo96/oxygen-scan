import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  email = new FormControl('');
  password = new FormControl('');

  loadingSubscription?: Subscription;
  loadingObservation?: Observable<boolean>;
  loading = false;
  error: string | null = null;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.setError(false);
  }

  async login(): Promise<void> {
    this.loading = true;
  
    const emailValue: string | null = this.email.value; // Típus meghatározása
    const passwordValue: string | null = this.password.value; // Típus meghatározása
  
    if (!emailValue || !passwordValue) {
      this.setError(true);
      this.loading = false;
      return;
    }
  
    try {
      const cred = await this.authService.login(emailValue, passwordValue);
      this.router.navigateByUrl('welcome');
      this.setError(false);
    } catch (error) {
      console.error(error);
      this.setError(true);
    } finally {
      this.loading = false;
    }
  }
  

  setError(isError: boolean): void {
    this.error = isError ? 'Hibás email és jelszó páros!' : null;
  }

  ngOnDestroy(): void {
    this.loadingSubscription?.unsubscribe();
  }
}
