import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 *
 * Usage:
 *   { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete (e.g., fetching user profile from API)
  await authService.waitForInit();

  // Now check if authenticated after initialization is done
  if (authService.isAuthenticated()) {
    return true;
  }

  // Not authenticated after initialization
  // Store the attempted URL for redirecting after login
  localStorage.setItem('gc_redirect_url', state.url);

  // Redirect to marketing site login (portal is for authenticated users only)
  window.location.href = 'https://www.gadgetcloud.io';
  return false;
};
