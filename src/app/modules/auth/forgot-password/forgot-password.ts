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
  isAuthenticated = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Check if user is already authenticated
    this.isAuthenticated.set(this.authService.isAuthenticated());
    
    // If already logged in, show message and redirect
    if (this.isAuthenticated()) {
      this.errorMessage.set('You are already signed in. Please change your password from your account settings or sign out first.');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);
    }
  }

  async onSubmit() {
    // Prevent password reset if user is already signed in
    if (this.authService.isAuthenticated()) {
      this.errorMessage.set('You are already signed in. Please change your password from your account settings or sign out first.');
      this.router.navigate(['/']);
      return;
    }

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

  async signOut() {
    try {
      await this.authService.signOut();
      // State will be cleared by authService, but update local state too
      this.isAuthenticated.set(false);
      this.errorMessage.set('');
      this.successMessage.set('You have been signed out. You can now request a password reset.');
    } catch (error: any) {
      // Even if signOut fails, clear local state
      this.isAuthenticated.set(false);
      this.errorMessage.set('');
      this.successMessage.set('You have been signed out. You can now request a password reset.');
    }
  }
}

