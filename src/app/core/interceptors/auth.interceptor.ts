import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  return null;
}

/**
 * HTTP Interceptor for adding auth tokens to requests
 * and handling 401 unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token from cookie (cross-subdomain support) or localStorage (fallback)
  let token = getCookie('gc_token');
  if (!token) {
    token = localStorage.getItem('auth_token');
  }

  console.log('[Auth Interceptor] Token check:', {
    cookieToken: getCookie('gc_token') ? 'found' : 'not found',
    localStorageToken: localStorage.getItem('auth_token') ? 'found' : 'not found',
    usingToken: token ? 'YES' : 'NO',
    tokenLength: token?.length || 0
  });

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[Auth Interceptor] Authorization header added to request');
  } else {
    console.log('[Auth Interceptor] No token - request sent without auth');
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error) => {
      // If 401 Unauthorized, clear token and redirect to home
      if (error.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Clear cookie
        document.cookie = 'gc_token=; path=/; domain=.gadgetcloud.io; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure';

        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};
