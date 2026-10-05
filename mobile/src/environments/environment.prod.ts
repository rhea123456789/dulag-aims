import { localApi } from './environment.local';

// Production builds read the same laptop address from environment.local.ts.
export const environment = {
  production: true,
  apiUrl: localApi.apiUrl,
  androidApiUrl: localApi.androidApiUrl,
};
