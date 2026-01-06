import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService, ApiResponse } from './api.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;  // Optional for backward compatibility
  role: string;
  mobile?: string;
  status?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface SignupResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface ProfileUpdateResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  role: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null
  });

  public authState$ = this.authState.asObservable();

  // Flag to toggle between API and localStorage mode
  private useApi = true; // API mode enabled

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    // Check for existing session on init
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    if (storedUser && (this.useApi ? token : true)) {
      try {
        const user = JSON.parse(storedUser);
        this.authState.next({
          isAuthenticated: true,
          user
        });
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
  }

  signup(firstName: string, lastName: string, email: string, password: string): Observable<{ success: boolean; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.post<SignupResponse>('/auth/signup', {
        firstName,
        lastName,
        email,
        password
      }).pipe(
        map(response => {
          console.log('Raw signup response:', response);
          if (response && response.access_token && response.user) {
            // Store token and user
            this.apiService.setToken(response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            this.authState.next({
              isAuthenticated: true,
              user: response.user
            });

            this.redirectAfterLogin();
            return { success: true };
          }
          return { success: false, error: 'Signup failed' };
        }),
        catchError(error => {
          console.error('Signup error:', error);
          // Extract error message from FastAPI response (error.error.detail) or fallback
          const errorMessage = error.error?.detail || error.message || 'Signup failed';
          return of({ success: false, error: errorMessage });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          const existingUsers = this.getStoredUsers();
          if (existingUsers.find(u => u.email === email)) {
            observer.next({ success: false, error: 'Email already registered' });
            observer.complete();
            return;
          }

          const newUser: User = {
            id: Date.now().toString(),
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            email,
            role: 'customer'
          };

          const users = [...existingUsers, { ...newUser, password }];
          localStorage.setItem('gc_users', JSON.stringify(users));
          localStorage.setItem('user', JSON.stringify(newUser));

          this.authState.next({
            isAuthenticated: true,
            user: newUser
          });

          observer.next({ success: true });
          observer.complete();
          this.redirectAfterLogin();
        }, 1000);
      });
    }
  }

  login(email: string, password: string): Observable<{ success: boolean; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.post<LoginResponse>('/auth/login', {
        email,
        password
      }).pipe(
        map(response => {
          console.log('Raw login response:', response);
          if (response && response.access_token && response.user) {
            // Store token and user
            this.apiService.setToken(response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            this.authState.next({
              isAuthenticated: true,
              user: response.user
            });

            this.redirectAfterLogin();
            return { success: true };
          }
          return { success: false, error: 'Login failed' };
        }),
        catchError(error => {
          console.error('Login error:', error);
          // Extract error message from FastAPI response (error.error.detail) or fallback
          const errorMessage = error.error?.detail || error.message || 'Invalid email or password';
          return of({ success: false, error: errorMessage });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          const users = this.getStoredUsers();
          const user = users.find(u => u.email === email && u.password === password);

          if (!user) {
            observer.next({ success: false, error: 'Invalid email or password' });
            observer.complete();
            return;
          }

          const { password: _, ...userWithoutPassword } = user;
          localStorage.setItem('user', JSON.stringify(userWithoutPassword));

          this.authState.next({
            isAuthenticated: true,
            user: userWithoutPassword as User
          });

          observer.next({ success: true });
          observer.complete();
          this.redirectAfterLogin();
        }, 1000);
      });
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    this.apiService.removeToken(); // Clear auth token
    this.authState.next({
      isAuthenticated: false,
      user: null
    });
    this.router.navigate(['/']);
  }

  /**
   * Update a single user profile field using RBAC endpoint
   */
  updateProfileField(field: string, value: string, reason: string): Observable<{ success: boolean; user?: User; error?: string }> {
    if (this.useApi) {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return of({ success: false, error: 'No user logged in' });
      }

      // API mode: Call RBAC update-field endpoint
      return this.apiService.post<any>('/rbac/update-field', {
        collection: 'gc-users',
        documentId: currentUser.id,
        field: field,
        value: value,
        reason: reason
      }).pipe(
        map(response => {
          console.log('Profile field update response:', response);
          if (response && response.success) {
            // Update the field in stored user
            const updatedUser = { ...currentUser, [field]: value };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.authState.next({
              isAuthenticated: true,
              user: updatedUser
            });
            return { success: true, user: updatedUser };
          }
          return { success: false, error: 'Profile update failed' };
        }),
        catchError(error => {
          console.error('Profile field update error:', error);
          // Extract error message from FastAPI response (error.error.detail) or fallback
          const errorMessage = error.error?.detail || error.message || 'Failed to update profile';
          return of({ success: false, error: errorMessage });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, [field]: value };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.authState.next({
              isAuthenticated: true,
              user: updatedUser
            });
            observer.next({ success: true, user: updatedUser });
          } else {
            observer.next({ success: false, error: 'No user logged in' });
          }
          observer.complete();
        }, 1000);
      });
    }
  }

  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.post<{ message: string }>('/auth/change-password', {
        old_password: currentPassword,
        new_password: newPassword
      }).pipe(
        map(() => {
          console.log('Password changed successfully');
          return { success: true };
        }),
        catchError(error => {
          console.error('Password change error:', error);
          // Extract error message from FastAPI response (error.error.detail) or fallback
          const errorMessage = error.error?.detail || error.message || 'Failed to change password';
          return of({ success: false, error: errorMessage });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          // In mock mode, just return success (no actual password validation)
          observer.next({ success: true });
          observer.complete();
        }, 1000);
      });
    }
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.apiService.post<{ message: string }>('/auth/forgot-password', {
      email
    }).pipe(
      map(response => {
        console.log('Password reset email requested');
        return {
          success: true,
          message: response.message || 'If an account with that email exists, you will receive password reset instructions.'
        };
      }),
      catchError(error => {
        console.error('Forgot password error:', error);
        // Even on error, return generic success message (security best practice)
        return of({
          success: true,
          message: 'If an account with that email exists, you will receive password reset instructions.'
        });
      })
    );
  }

  /**
   * Validate password reset token
   */
  validateResetToken(token: string): Observable<{ valid: boolean; email?: string; error?: string }> {
    return this.apiService.post<{ valid: boolean; email: string }>('/auth/validate-reset-token', {
      token
    }).pipe(
      map(response => {
        console.log('Reset token validated successfully');
        return {
          valid: true,
          email: response.email
        };
      }),
      catchError(error => {
        console.error('Token validation error:', error);
        const errorMessage = error.error?.detail || error.message || 'Invalid or expired reset token';
        return of({
          valid: false,
          error: errorMessage
        });
      })
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.apiService.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword
    }).pipe(
      map(response => {
        console.log('Password reset successful');
        return {
          success: true,
          message: response.message || 'Password reset successfully'
        };
      }),
      catchError(error => {
        console.error('Reset password error:', error);
        const errorMessage = error.error?.detail || error.message || 'Failed to reset password';
        return of({
          success: false,
          error: errorMessage
        });
      })
    );
  }

  /**
   * Redirect after successful login
   * Uses stored redirect URL or defaults to dashboard
   */
  private redirectAfterLogin(): void {
    const redirectUrl = localStorage.getItem('gc_redirect_url');

    if (redirectUrl) {
      localStorage.removeItem('gc_redirect_url');
      this.router.navigateByUrl(redirectUrl);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private getStoredUsers(): any[] {
    const stored = localStorage.getItem('gc_users');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored users:', e);
      return [];
    }
  }

  getCurrentUser(): User | null {
    return this.authState.value.user;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }
}
