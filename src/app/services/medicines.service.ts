import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Medicine, CreateMedicineRequest, UpdateMedicineRequest, MedicinePage } from '../models/medicine.model';

@Injectable({
  providedIn: 'root'
})
export class MedicinesService {

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10, sort: string = 'name,asc'): Observable<MedicinePage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    return this.http.get<MedicinePage>(`${environment.apiUrl}/medicines`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${environment.apiUrl}/medicines/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  create(medicine: CreateMedicineRequest): Observable<Medicine> {
    return this.http.post<Medicine>(`${environment.apiUrl}/medicines`, medicine)
      .pipe(
        catchError(this.handleError)
      );
  }

  update(id: number, medicine: UpdateMedicineRequest): Observable<Medicine> {
    return this.http.put<Medicine>(`${environment.apiUrl}/medicines/${id}`, medicine)
      .pipe(
        catchError(this.handleError)
      );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/medicines/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse | Error) {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        errorMessage = error.error.message;
      } else {
        if (error.status === 404) {
          errorMessage = 'Medicina no encontrada';
        } else if (error.status === 409) {
          errorMessage = 'Ya existe una medicina con ese nombre';
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
