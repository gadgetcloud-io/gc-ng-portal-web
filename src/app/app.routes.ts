import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  // Public pages (redirect to dashboard if already logged in)
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
    canActivate: [publicGuard]
  },
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
    path: 'features',
    loadComponent: () => import('./pages/features/features').then(m => m.FeaturesComponent),
    data: {
      breadcrumb: {
        label: 'Features'
      }
    }
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing').then(m => m.PricingComponent),
    data: {
      breadcrumb: {
        label: 'Pricing'
      }
    }
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then(m => m.AboutComponent),
    data: {
      breadcrumb: {
        label: 'About Us'
      }
    }
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

  // Blog routes (public)
  {
    path: 'blog',
    data: {
      breadcrumb: {
        label: 'News & Updates'
      }
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/blog/blog').then(m => m.BlogComponent)
      },
      {
        path: ':slug',
        loadComponent: () => import('./pages/blog-detail/blog-detail').then(m => m.BlogDetailComponent),
        data: {
          breadcrumb: {
            label: (snapshot: any) => snapshot.data['postTitle'] || 'Article'
          }
        }
      }
    ]
  }
];
