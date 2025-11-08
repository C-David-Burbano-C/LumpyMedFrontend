import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DoseRequest, DoseResponse } from '../models/dose.model';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {
  private apiUrl = `${environment.apiUrl}/calculator`;

  constructor(private http: HttpClient) {}

  calculateDose(request: DoseRequest): Observable<DoseResponse> {
    return this.http.post<DoseResponse>(`${this.apiUrl}/dose`, request);
  }
}
