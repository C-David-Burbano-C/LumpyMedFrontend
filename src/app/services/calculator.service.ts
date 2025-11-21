import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DoseRequest, DoseResponse, DoseHistoryItem } from '../models/dose.model';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {

  constructor(private http: HttpClient) {}

  calculateDose(request: DoseRequest): Observable<DoseResponse> {
    return this.http.post<DoseResponse>(`${environment.apiUrl}/calculator/dose`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  getHistory(): Observable<DoseHistoryItem[]> {
    return this.http.get<DoseHistoryItem[]>(`${environment.apiUrl}/calculator/history`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse | Error) {
    let errorMessage = 'Ha ocurrido un error al calcular la dosis';

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        errorMessage = error.error.message;
      } else {
        if (error.status === 400) {
          errorMessage = 'Datos inválidos para el cálculo';
        } else if (error.status === 404) {
          errorMessage = 'Medicina no encontrada';
        } else if (error.error && typeof error.error === 'object' && error.error.message) {
          errorMessage = error.error.message;
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
