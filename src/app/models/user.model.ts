export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  rol: 'USER' | 'ADMIN';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  rol: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  message: string;
  token: string;
}
