import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService, ApiResponse } from './api.service';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface SignupResponse {
  token: string;
  user: User;
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
    const storedUser = localStorage.getItem('gc_user');
    const token = localStorage.getItem('gc_token');

    if (storedUser && (this.useApi ? token : true)) {
      try {
        const user = JSON.parse(storedUser);
        this.authState.next({
          isAuthenticated: true,
          user
        });
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('gc_user');
        localStorage.removeItem('gc_token');
      }
    }
  }

  signup(name: string, email: string, password: string): Observable<{ success: boolean; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.post<ApiResponse<SignupResponse>>('/auth/signup', {
        name,
        email,
        password
      }).pipe(
        map(response => {
          if (response.success && response.data) {
            // Store token and user
            this.apiService.setToken(response.data.token);
            localStorage.setItem('gc_user', JSON.stringify(response.data.user));

            this.authState.next({
              isAuthenticated: true,
              user: response.data.user
            });

            this.redirectAfterLogin();
            return { success: true };
          }
          return { success: false, error: response.error || 'Signup failed' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Signup failed' });
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
            name,
            email
          };

          const users = [...existingUsers, { ...newUser, password }];
          localStorage.setItem('gc_users', JSON.stringify(users));
          localStorage.setItem('gc_user', JSON.stringify(newUser));

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
      return this.apiService.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password
      }).pipe(
        map(response => {
          if (response.success && response.data) {
            // Store token and user
            this.apiService.setToken(response.data.token);
            localStorage.setItem('gc_user', JSON.stringify(response.data.user));

            this.authState.next({
              isAuthenticated: true,
              user: response.data.user
            });

            this.redirectAfterLogin();
            return { success: true };
          }
          return { success: false, error: response.error || 'Login failed' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Invalid email or password' });
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
          localStorage.setItem('gc_user', JSON.stringify(userWithoutPassword));

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
    localStorage.removeItem('gc_user');
    this.apiService.removeToken(); // Clear auth token
    this.authState.next({
      isAuthenticated: false,
      user: null
    });
    this.router.navigate(['/']);
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
