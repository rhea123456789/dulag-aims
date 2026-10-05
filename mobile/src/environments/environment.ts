import { localApi } from './environment.local';

// Development builds read the API address from environment.local.ts.
export const environment = {
  production: false,
  apiUrl: localApi.apiUrl,
  androidApiUrl: localApi.androidApiUrl,
};
