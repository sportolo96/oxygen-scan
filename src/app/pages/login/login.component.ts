import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {AuthService} from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  loadingSubscription?: Subscription;
  loadingObservation?: Observable<boolean>;
  loading = false;
  error: string | null = null;
  signInForm: FormGroup;

  constructor(private router: Router, private authService: AuthService) {
     this.signInForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
   }

  ngOnInit(): void {
    this.setError(false);
  }

  async login(): Promise<void> {
    this.loading = true;

    const { email, password } = this.signInForm.value;

    if (!email || !password) {
      this.setError(true);
      this.loading = false;
      return;
    }

    try {
      const cred = await this.authService.login(email, password);
      window.location.reload();
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
