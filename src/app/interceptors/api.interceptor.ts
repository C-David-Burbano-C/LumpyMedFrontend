import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem(environment.tokenKey);
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error de conexión. Inténtalo nuevamente.';

        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          switch (error.status) {
            case 0:
              errorMessage = 'Error de conexión. Inténtalo nuevamente.';
              break;
            case 400:
              errorMessage = 'Datos inválidos.';
              break;
            case 401:
              errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
              localStorage.removeItem(environment.tokenKey);
              localStorage.removeItem(environment.userKey);
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = 'Acceso no autorizado.';
              break;
            case 404:
              errorMessage = 'Recurso no encontrado.';
              break;
            case 500:
              errorMessage = 'Error del servidor.';
              break;
            default:
              errorMessage = error.error?.message || errorMessage;
          }
        }

        return throwError(() => ({ message: errorMessage, status: error.status }));
      })
    );
  }
}
