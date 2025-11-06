import { UserResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const apiService = {
  async getUserInfo(pubkey: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_URL}/api/user/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          npub: pubkey,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return a default response for non-existent users
          return {
            pubkey,
            npub: '',
            is_whitelisted: false
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Return a default response on error
      return {
        pubkey,
        npub: '',
        is_whitelisted: false
      };
    }
  },

  async whitelistUser(pubkey: string, apiKey: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/whitelist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          npub: pubkey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error whitelisting user:', error);
      throw error; // Re-throw as this is a critical operation
    }
  },
};