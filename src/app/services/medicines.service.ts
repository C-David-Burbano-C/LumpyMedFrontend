import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Medicine } from '../models/medicine.model';

@Injectable({
  providedIn: 'root'
})
export class MedicinesService {
  private apiUrl = `${environment.apiUrl}/medicines`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(this.apiUrl);
  }

  getById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.apiUrl}/${id}`);
  }

  create(medicine: Medicine): Observable<Medicine> {
    return this.http.post<Medicine>(this.apiUrl, medicine);
  }

  update(id: number, medicine: Medicine): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.apiUrl}/${id}`, medicine);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
