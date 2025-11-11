import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, delay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Usuarios de ejemplo para modo demo (sin backend)
  private mockUsers = [
    { username: 'admin', email: 'admin@lumpymed.com', password: 'admin123', rol: 'ADMIN' as const },
    { username: 'doctor', email: 'doctor@lumpymed.com', password: 'doctor123', rol: 'ADMIN' as const },
    { username: 'user', email: 'user@lumpymed.com', password: 'user123', rol: 'USER' as const }
  ];

  constructor(private router: Router) {
    const storedUser = localStorage.getItem(environment.userKey);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Simulación de login sin backend
    const user = this.mockUsers.find(
      u => (u.username === credentials.username || u.email === credentials.username) 
           && u.password === credentials.password
    );

    if (user) {
      // Generar un token simulado
      const mockToken = this.generateMockToken(user);
      const response: AuthResponse = { 
        token: mockToken,
        message: 'Login exitoso'
      };
      
      localStorage.setItem(environment.tokenKey, mockToken);
      const userInfo: User = {
        username: user.username,
        email: user.email,
        rol: user.rol
      };
      localStorage.setItem(environment.userKey, JSON.stringify(userInfo));
      this.currentUserSubject.next(userInfo);
      
      return of(response).pipe(delay(500)); // Simular delay de red
    } else {
      throw new Error('Credenciales inválidas');
    }
  }

  register(userData: RegisterRequest): Observable<any> {
    // Simulación de registro sin backend
    console.log('Usuario registrado (modo demo):', userData);
    return of({ message: 'Usuario registrado exitosamente' }).pipe(delay(500));
  }

  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(environment.tokenKey);
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000;
      return Date.now() < expiration;
    } catch (error) {
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  private generateMockToken(user: any): string {
    // Generar un token JWT simulado (no es seguro, solo para demo)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.username,
      email: user.email,
      rol: user.rol,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  private decodeToken(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.sub || '',
        email: payload.email || '',
        rol: payload.rol || 'USER'
      };
    } catch (error) {
      return {
        username: '',
        email: '',
        rol: 'USER'
      };
    }
  }
}
