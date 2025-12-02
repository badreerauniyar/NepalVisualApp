import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superadminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('Superadmin guard activated');
  console.log('Is authenticated:', authService.isAuthenticated());
  
  if (!authService.isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Wait for profile to load (with timeout)
  const profileLoaded = await authService.waitForProfile(3000);
  
  if (!profileLoaded) {
    console.warn('Profile not loaded after waiting, checking anyway...');
  }

  const profile = authService.currentUserProfile();
  const roleName = profile?.role_name;
  
  console.log('User profile:', profile);
  console.log('Role name from profile:', roleName);
  console.log('Is superadmin check:', authService.isSuperAdmin());
  
  // Check if user is superadmin (case-insensitive)
  if (roleName && roleName.toLowerCase() === 'superadmin') {
    console.log('Access granted - user is superadmin');
    return true;
  }

  // Also check the computed signal
  if (authService.isSuperAdmin()) {
    console.log('Access granted - isSuperAdmin() returned true');
    return true;
  }

  console.log('Access denied - user is not superadmin, redirecting to home');
  console.log('Profile data:', JSON.stringify(profile, null, 2));
  // Redirect to home if not superadmin
  router.navigate(['/']);
  return false;
};

