import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Public Guard - Redirects authenticated users away from public pages
 *
 * Use this for pages like login/signup where logged-in users shouldn't go.
 * They'll be redirected to the dashboard instead.
 *
 * Usage:
 *   { path: '', component: HomeComponent, canActivate: [publicGuard] }
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Already logged in, redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
