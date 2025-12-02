import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const email = this.email().trim();
      const password = this.password();

      if (!email || !password) {
        this.errorMessage.set('Please enter both email and password');
        this.isLoading.set(false);
        return;
      }

      await this.authService.signIn(email, password);
      
      // Redirect to home after successful login
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage.set(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(val => !val);
  }
}

