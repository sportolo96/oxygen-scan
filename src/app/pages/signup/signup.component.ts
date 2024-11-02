import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  
  signUpForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private userService: UserService
  ) {

    this.signUpForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      rePassword: new FormControl('', [Validators.required]),
      name: new FormGroup({
        firstname: new FormControl('', [Validators.required]),
        lastname: new FormControl('', [Validators.required])
      })
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.setError(true);
      return;
    }

    this.loading = true;
    const { email, password } = this.signUpForm.value;

    this.authService.signup(email, password).then(cred => {
      const user: User = {
        id: cred.user?.uid as string,
        email: email,
      };

      this.userService.create(user).then(() => {
        console.log('User added successfully.');
        this.router.navigateByUrl('/welcome');
        this.loading = false;
        this.setError(false);
      }).catch(error => {
        console.error(error);
        this.loading = false;
        this.setError(true);
      });
    }).catch(error => {
      console.error(error);
      this.loading = false;
      this.setError(true);
    });
  }

  setError(isError: boolean): void {
    this.error = isError ? 'Nem megfelelő adatok!' : null;
  }

  goToPage(pageName: string): void {
    this.router.navigate([pageName]);
  }
}
