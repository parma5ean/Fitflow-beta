import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68f7b0f8ebb2a3775b552b00", 
  requiresAuth: true // Ensure authentication is required for all operations
});
