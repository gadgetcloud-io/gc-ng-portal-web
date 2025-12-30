import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  userInfo = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '+1 (555) 123-4567',
    role: 'Free User',
    avatar: '',
    joinDate: 'January 2025',
    devicesCount: 0
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      // Redirect to home if not authenticated
      this.router.navigate(['/']);
      return;
    }

    // Parse name into first and last name
    const nameParts = this.user.name.split(' ');
    this.userInfo.firstName = nameParts[0] || '';
    this.userInfo.lastName = nameParts.slice(1).join(' ') || '';
    this.userInfo.email = this.user.email;
    this.userInfo.avatar = this.user.name.charAt(0).toUpperCase();
  }

  updateProfile(): void {
    console.log('Update profile clicked');
  }

  changePassword(): void {
    console.log('Change password clicked');
  }

  toggleTwoFactor(): void {
    console.log('Toggle 2FA clicked');
  }
}
