import type { User } from './user';

export interface LoginCredentials {
  username_or_email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error_code?: string;
  details?: unknown;
}
