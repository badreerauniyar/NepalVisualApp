import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  email = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

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
    this.successMessage.set('');

    try {
      const email = this.email().trim();

      if (!email) {
        this.errorMessage.set('Please enter your email address');
        this.isLoading.set(false);
        return;
      }

      await this.authService.resetPassword(email);
      
      this.successMessage.set('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
    } catch (error: any) {
      console.error('Reset password error:', error);
      this.errorMessage.set(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

