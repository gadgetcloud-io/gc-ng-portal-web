import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-root-redirect',
  standalone: true,
  template: '', // No template needed - just redirects
  styles: []
})
export class RootRedirectComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Wait for auth initialization to complete
    await this.authService.waitForInit();

    // Redirect based on authentication state
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
