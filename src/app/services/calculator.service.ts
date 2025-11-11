import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DoseRequest, DoseResponse } from '../models/dose.model';

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

  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error al calcular la dosis';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 400) {
        errorMessage = 'Datos inválidos para el cálculo';
      } else if (error.status === 404) {
        errorMessage = 'Medicina no encontrada';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
