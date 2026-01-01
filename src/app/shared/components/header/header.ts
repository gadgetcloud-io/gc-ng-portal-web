import { Component, OnInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../button/button';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { SignupDialogComponent } from '../signup-dialog/signup-dialog';
import { AuthService, AuthState } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent, LoginDialogComponent, SignupDialogComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isLoginDialogOpen = false;
  isSignupDialogOpen = false;
  isUserMenuOpen = false;
  isScrolled = false;
  authState: AuthState = { isAuthenticated: false, user: null };
  private authSubscription?: Subscription;

  navLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ];

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.authState$.subscribe(
      state => this.authState = state
    );
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 10;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  openLoginDialog(): void {
    this.isLoginDialogOpen = true;
    this.isSignupDialogOpen = false;
    this.closeMenu();
  }

  openSignupDialog(): void {
    this.isSignupDialogOpen = true;
    this.isLoginDialogOpen = false;
    this.closeMenu();
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
  }

  closeSignupDialog(): void {
    this.isSignupDialogOpen = false;
  }

  switchToSignup(): void {
    this.isLoginDialogOpen = false;
    this.isSignupDialogOpen = true;
  }

  switchToLogin(): void {
    this.isSignupDialogOpen = false;
    this.isLoginDialogOpen = true;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  onLoginSuccess(): void {
    this.ngZone.run(() => {
      this.closeLoginDialog();
    });
  }

  onSignupSuccess(): void {
    this.ngZone.run(() => {
      this.closeSignupDialog();
    });
  }

  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
    this.closeMenu();
  }
}
