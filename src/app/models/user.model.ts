export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  role: 'USER' | 'ADMIN';
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  authorities: string[];
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RefreshTokenResponse {
  token: string;
}
