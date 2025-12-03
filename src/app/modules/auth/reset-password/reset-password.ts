import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  password = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isValidToken = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Supabase sends tokens in URL fragment (hash), not query params
    // Check both fragment and query params to handle different email clients
    const checkToken = async () => {
      // Check URL fragment first (Supabase default)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1)); // Remove #
        const accessToken = params.get('access_token');
        const type = params.get('type');

        if (accessToken && type === 'recovery') {
          try {
            // Set the session using the token
            const supabase = this.authService.getSupabaseClient();
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get('refresh_token') || ''
            });

            if (error) throw error;
            this.isValidToken.set(true);
            return;
          } catch (error: any) {
            console.error('Token verification error:', error);
            this.errorMessage.set('Invalid or expired reset link. Please request a new password reset.');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
            return;
          }
        }
      }

      // Fallback: Check query params (some email clients might put it there)
      this.route.queryParams.subscribe(async (queryParams) => {
        const accessToken = queryParams['access_token'];
        const type = queryParams['type'];

        if (accessToken && type === 'recovery') {
          try {
            const supabase = this.authService.getSupabaseClient();
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: queryParams['refresh_token'] || ''
            });

            if (error) throw error;
            this.isValidToken.set(true);
          } catch (error: any) {
            console.error('Token verification error:', error);
            this.errorMessage.set('Invalid or expired reset link. Please request a new password reset.');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          }
        } else {
          // No valid token found
          this.errorMessage.set('Invalid or expired reset link. Please request a new password reset.');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      });
    };

    await checkToken();
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const password = this.password();
      const confirmPassword = this.confirmPassword();

      if (!password || !confirmPassword) {
        this.errorMessage.set('Please enter both password fields');
        this.isLoading.set(false);
        return;
      }

      if (password.length < 6) {
        this.errorMessage.set('Password must be at least 6 characters long');
        this.isLoading.set(false);
        return;
      }

      if (password !== confirmPassword) {
        this.errorMessage.set('Passwords do not match');
        this.isLoading.set(false);
        return;
      }

      await this.authService.updatePassword(password);
      
      // Success - redirect to login
      this.router.navigate(['/login'], {
        queryParams: { passwordReset: 'success' }
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      this.errorMessage.set(error.message || 'Failed to reset password. The link may have expired. Please request a new one.');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(val => !val);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(val => !val);
  }
}

