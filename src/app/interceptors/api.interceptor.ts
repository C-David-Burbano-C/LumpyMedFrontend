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
    const isApiRequest = request.url.startsWith(environment.apiUrl) || request.url.startsWith('/');

    if (isApiRequest) {
      // Excluir endpoints públicos que no requieren autenticación
      // Verificar tanto URLs completas como rutas relativas
      const isPublicEndpoint = 
        request.url.includes('/auth/check-username/') || 
        request.url.includes('/auth/check-email/') ||
        request.url.includes('/auth/login') ||
        request.url.includes('/auth/register') ||
        request.url.includes('/auth/refresh') ||
        request.url.includes('check-username') ||
        request.url.includes('check-email');

      // Agregar token de autorización si existe solo para llamadas al backend propio
      // y no es un endpoint público
      const token = localStorage.getItem(environment.tokenKey);
      
      if (token && !isPublicEndpoint) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      // Agregar Content-Type si no está presente y es un POST/PUT/PATCH
      if (!request.headers.has('Content-Type') &&
          (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        request = request.clone({
          setHeaders: {
            'Content-Type': 'application/json'
          }
        });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (isApiRequest && error.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem(environment.tokenKey);
          localStorage.removeItem(environment.userKey);
          // Recargar la página completamente para limpiar el estado
          window.location.href = '/login';
        }
        return throwError(() => error);
      })
    );
  }
}
