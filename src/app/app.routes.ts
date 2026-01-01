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
    path: 'features',
    loadComponent: () => import('./pages/features/features').then(m => m.FeaturesComponent)
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing').then(m => m.PricingComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent)
  },

  // Protected pages (require authentication)
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Dashboard',
        icon: '🏠'
      }
    }
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Profile',
        icon: '👤'
      }
    }
  },
  {
    path: 'my-gadgets',
    loadComponent: () => import('./pages/devices/devices').then(m => m.DevicesComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'My Gadgets',
        icon: '📱'
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
        },
        icon: '📋'
      }
    }
  },
  {
    path: 'service-requests',
    loadComponent: () => import('./pages/service-requests/service-requests').then(m => m.ServiceRequestsComponent),
    canActivate: [authGuard],
    data: {
      breadcrumb: {
        label: 'Service Requests',
        icon: '🔧'
      }
    }
  }
];
