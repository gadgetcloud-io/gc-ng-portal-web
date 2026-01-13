import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard Factory - Creates guards that check for specific roles
 *
 * Usage:
 *   { path: 'admin/plans', canActivate: [authGuard, roleGuard('admin')] }
 *   { path: 'support/tickets', canActivate: [authGuard, roleGuard('support', 'admin')] }
 *
 * @param allowedRoles - One or more roles that are allowed to access the route
 * @returns CanActivateFn that checks if user has one of the allowed roles
 */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait for auth initialization to complete
    await authService.waitForInit();

    // Get current user
    const user = authService.getCurrentUser();

    if (!user) {
      // Not authenticated - redirect to login
      localStorage.setItem('gc_redirect_url', state.url);
      router.navigate(['/login']);
      return false;
    }

    // Check if user's role is in the allowed roles
    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // User doesn't have required role - redirect to dashboard with error
    console.warn(`Access denied: User role '${user.role}' not in allowed roles [${allowedRoles.join(', ')}] for route ${state.url}`);

    // Redirect to dashboard (user is authenticated but not authorized)
    router.navigate(['/dashboard']);
    return false;
  };
}

/**
 * Admin Guard - Shorthand for roleGuard('admin')
 *
 * Usage:
 *   { path: 'admin/plans', canActivate: [authGuard, adminGuard] }
 */
export const adminGuard: CanActivateFn = roleGuard('admin');

/**
 * Support Guard - Allows support and admin roles
 *
 * Usage:
 *   { path: 'support/queue', canActivate: [authGuard, supportGuard] }
 */
export const supportGuard: CanActivateFn = roleGuard('support', 'admin');
