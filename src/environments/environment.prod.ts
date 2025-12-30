/**
 * Production Environment Configuration
 */
export const environment = {
  production: true,
  apiUrl: 'https://rest.gadgetcloud.io/api', // Production API gateway (gc-py-proxy)
  apiTimeout: 30000, // 30 seconds
  enableLogging: false
};
