import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for adding auth tokens to requests
 * and handling 401 unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token from localStorage
  const token = localStorage.getItem('gc_token');

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error) => {
      // If 401 Unauthorized, clear token and redirect to home
      if (error.status === 401) {
        localStorage.removeItem('gc_token');
        localStorage.removeItem('gc_user');
        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};
