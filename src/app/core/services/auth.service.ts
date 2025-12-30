import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
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

  constructor(private router: Router) {
    // Check for existing session on init
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const storedUser = localStorage.getItem('gc_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.authState.next({
          isAuthenticated: true,
          user
        });
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('gc_user');
      }
    }
  }

  signup(name: string, email: string, password: string): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      // Simulate API call delay
      setTimeout(() => {
        // Check if user already exists
        const existingUsers = this.getStoredUsers();
        if (existingUsers.find(u => u.email === email)) {
          observer.next({ success: false, error: 'Email already registered' });
          observer.complete();
          return;
        }

        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          name,
          email
        };

        // Store user credentials (in production, this would be done server-side)
        const users = [...existingUsers, { ...newUser, password }];
        localStorage.setItem('gc_users', JSON.stringify(users));

        // Set current user
        localStorage.setItem('gc_user', JSON.stringify(newUser));
        this.authState.next({
          isAuthenticated: true,
          user: newUser
        });

        observer.next({ success: true });
        observer.complete();

        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      }, 1000);
    });
  }

  login(email: string, password: string): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      // Simulate API call delay
      setTimeout(() => {
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
          observer.next({ success: false, error: 'Invalid email or password' });
          observer.complete();
          return;
        }

        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;

        // Set current user
        localStorage.setItem('gc_user', JSON.stringify(userWithoutPassword));
        this.authState.next({
          isAuthenticated: true,
          user: userWithoutPassword as User
        });

        observer.next({ success: true });
        observer.complete();

        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      }, 1000);
    });
  }

  logout(): void {
    localStorage.removeItem('gc_user');
    this.authState.next({
      isAuthenticated: false,
      user: null
    });
    this.router.navigate(['/']);
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
