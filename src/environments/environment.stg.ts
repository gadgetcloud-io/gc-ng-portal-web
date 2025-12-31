/**
 * Production Environment Configuration
 */
export const environment = {
  production: false,
  apiUrl: 'https://rest-stg.gadgetcloud.io/api', // Production API gateway (gc-py-proxy)
  apiTimeout: 30000, // 30 seconds
  enableLogging: true
};
