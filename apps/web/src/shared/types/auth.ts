export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoKey?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: Pick<User, 'id' | 'email' | 'name'>;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: Pick<User, 'id' | 'email' | 'name'>;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

export interface Setup2faResponse {
  otpauthUrl: string;
}
