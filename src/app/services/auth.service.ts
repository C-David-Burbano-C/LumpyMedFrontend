import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, RegisterResponse, RefreshTokenResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
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
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem(environment.tokenKey, response.token);
          const user: User = {
            username: response.username,
            email: '', // El backend no devuelve email en login
            rol: response.authorities.includes('ROLE_ADMIN') ? 'ADMIN' : 'USER'
          };
          localStorage.setItem(environment.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${environment.apiUrl}/auth/refresh`, {})
      .pipe(
        tap(response => {
          localStorage.setItem(environment.tokenKey, response.token);
        }),
        catchError(this.handleError)
      );
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

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del lado del servidor
      if (error.status === 401) {
        errorMessage = 'Credenciales inválidas';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = 'El usuario ya existe';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
