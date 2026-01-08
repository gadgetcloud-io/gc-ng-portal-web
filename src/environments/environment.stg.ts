/**
 * Staging Environment Configuration
 */
export const environment = {
  production: false,
  apiUrl: 'https://gc-py-backend-198991430816.asia-south1.run.app/api', // Staging Cloud Run API
  marketingSiteUrl: 'https://www-stg.gadgetcloud.io', // Staging marketing site
  apiTimeout: 30000, // 30 seconds
  enableLogging: true
};
