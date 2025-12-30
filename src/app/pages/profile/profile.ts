import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {
  userInfo = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    mobile: '+1 (555) 123-4567',
    role: 'Premium User',
    avatar: 'JD',
    joinDate: 'January 2024',
    devicesCount: 12
  };

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
