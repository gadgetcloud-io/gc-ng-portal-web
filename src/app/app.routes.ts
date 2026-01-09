import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  // Root route - redirect based on auth state
  {
    path: '',
    loadComponent: () => import('./pages/root-redirect/root-redirect').then(m => m.RootRedirectComponent),
    pathMatch: 'full'
  },

  // Auth pages (accessible when not logged in)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup').then(m => m.SignupComponent),
    canActivate: [publicGuard]
  },

  // Navigation menu shortcuts (redirect to full descriptive paths)
  {
    path: 'gadgets',
    redirectTo: '/my-gadgets',
    pathMatch: 'full'
  },
  {
    path: 'requests',
    redirectTo: '/service-requests',
    pathMatch: 'full'
  },
  {
    path: 'activity',
    loadComponent: () => import('./pages/activity/activity').then(m => m.ActivityComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Activity',
        icon: '📋'
      }
    }
  },

  // Password reset pages (accessible when not logged in)
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then(m => m.VerifyEmailComponent),
    canActivate: [publicGuard]
  },

  // Protected pages (require authentication)
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Dashboard'
      }
    }
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Profile'
      }
    }
  },
  {
    path: 'my-gadgets',
    loadComponent: () => import('./pages/devices/devices').then(m => m.DevicesComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'My Gadgets'
      }
    }
  },
  {
    path: 'my-gadgets/:id',
    loadComponent: () => import('./pages/device-detail/device-detail').then(m => m.DeviceDetailComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: (snapshot: any) => {
          // Get device name from component state if available
          // For now, just return a placeholder
          return snapshot.data['deviceName'] || 'Device Details';
        }
      }
    }
  },
  {
    path: 'service-requests',
    loadComponent: () => import('./pages/service-requests/service-requests').then(m => m.ServiceRequestsComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Manage Tickets'
      }
    }
  },
  {
    path: 'service-requests/:id',
    loadComponent: () => import('./pages/service-ticket-detail/service-ticket-detail').then(m => m.ServiceTicketDetailComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: (snapshot: any) => {
          return snapshot.data['ticketId'] || 'Ticket Details';
        }
      }
    }
  },

  // Admin pages (require authentication and admin role)
  {
    path: 'admin/plans',
    loadComponent: () => import('./pages/admin/plans/admin-plans').then(m => m.AdminPlansComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Subscription Plans',
        icon: '💳'
      }
    }
  }
];
