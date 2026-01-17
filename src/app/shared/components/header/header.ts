import { Component, OnInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, AuthState } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isUserMenuOpen = false;
  isScrolled = false;
  authState: AuthState = { isAuthenticated: false, user: null };
  tokenBalance: number | null = null;
  lowBalanceWarning = false;
  private authSubscription?: Subscription;
  private tokenSubscription?: Subscription;
  private lowBalanceSubscription?: Subscription;

  navLinks = [
    { path: '/dashboard', label: 'Dashboard', exact: false },
    { path: '/gadgets', label: 'Gadgets', exact: false },
    { path: '/requests', label: 'Requests', exact: false },
    { path: '/activity', label: 'Activity', exact: false }
  ];

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.authState$.subscribe(
      state => {
        this.authState = state;
        // Load token balance when authenticated
        if (state.isAuthenticated) {
          this.tokenService.refreshBalance();
        } else {
          this.tokenBalance = null;
          this.lowBalanceWarning = false;
        }
      }
    );

    // Subscribe to token balance updates
    this.tokenSubscription = this.tokenService.balance$.subscribe(
      balance => this.tokenBalance = balance
    );

    this.lowBalanceSubscription = this.tokenService.lowBalanceWarning$.subscribe(
      warning => this.lowBalanceWarning = warning
    );
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.tokenSubscription?.unsubscribe();
    this.lowBalanceSubscription?.unsubscribe();
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

  navigateToLogin(): void {
    this.router.navigate(['/login']);
    this.closeMenu();
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup']);
    this.closeMenu();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
    this.closeMenu();
  }
}
