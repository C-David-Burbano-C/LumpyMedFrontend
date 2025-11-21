import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, RefreshTokenResponse } from '../models/user.model';
import { LogoutConfirmationDialogComponent } from '../modules/shared/logout-confirmation-dialog/logout-confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog
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
          
          // Decodificar el token JWT para obtener el username
          try {
            const payload = JSON.parse(atob(response.token.split('.')[1]));
            
            const username = payload.sub || credentials.username;
            
            // Determinar el rol basado en el username
            // Si el username es "admin", entonces es ADMIN, sino es USER
            const role: 'ADMIN' | 'USER' = username.toLowerCase() === 'admin' ? 'ADMIN' : 'USER';
            
            const user: User = {
              username: username,
              email: '',
              role: role
            };
            
            localStorage.setItem(environment.userKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
          } catch (error) {
            // Error decodificando token
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<string> {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData, {
      responseType: 'text'
    }).pipe(
      map(response => response as string),
      catchError(this.handleError)
    );
  }

  // MÉTODOS DE VERIFICACIÓN REMOVIDOS - El backend valida duplicados en el registro
  // checkUsernameAvailability(username: string): Observable<boolean> { ... }
  // checkEmailAvailability(email: string): Observable<boolean> { ... }

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
    const dialogRef = this.dialog.open(LogoutConfirmationDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        localStorage.removeItem(environment.tokenKey);
        localStorage.removeItem(environment.userKey);
        this.currentUserSubject.next(null);
        // Recargar la página completamente para limpiar el estado
        window.location.href = '/';
      }
    });
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
      // Primero intentar obtener mensaje del backend
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 400) {
        // Intentar extraer mensaje específico del backend
        if (error.error && typeof error.error === 'string') {
          const errorStr = error.error.toLowerCase();

          // Traducir errores comunes de base de datos a mensajes amigables
          if (errorStr.includes('duplicate key value violates unique constraint') ||
              errorStr.includes('unique constraint')) {
            if (errorStr.includes('username')) {
              errorMessage = 'El nombre de usuario ya está registrado. Por favor, elige otro.';
            } else if (errorStr.includes('email')) {
              errorMessage = 'El correo electrónico ya está registrado. Por favor, usa otro.';
            } else {
              errorMessage = 'Ya existe un registro con estos datos.';
            }
          } else if (errorStr.includes('check constraint') || errorStr.includes('violates check constraint')) {
            errorMessage = 'Los datos proporcionados no cumplen con los requisitos.';
          } else if (errorStr.includes('null value') || errorStr.includes('not-null constraint')) {
            errorMessage = 'Faltan datos obligatorios.';
          } else {
            // Si no es un error conocido, mostrar el mensaje original pero más limpio
            errorMessage = error.error.split('[')[0].trim() || 'Error en la solicitud.';
          }
        } else {
          errorMessage = 'Error en la solicitud';
        }
      } else if (error.status === 401) {
        errorMessage = 'Credenciales inválidas';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = 'El usuario ya existe';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
