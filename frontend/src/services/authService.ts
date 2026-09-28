import { api, tokenStorage } from './api';
import type { LoginCredentials, TokenResponse } from '../types/auth';
import type { User } from '../types/user';

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', credentials);
    if (response.access_token) {
      tokenStorage.set(response.access_token);
    }
    return response;
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await api.post<{ success: boolean; message: string }>('/auth/logout');
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      tokenStorage.remove();
    }
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.get();
  }
};
