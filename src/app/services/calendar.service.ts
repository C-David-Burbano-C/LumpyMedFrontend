import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CalendarEvent, CreateEventRequest, UpdateEventRequest, AiSuggestionRequest, AiSuggestionResponse, CalendarEventsResponse, CalendarFilters } from '../models/calendar.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(private http: HttpClient) {}

  getAllEvents(filters?: CalendarFilters): Observable<CalendarEventsResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page !== undefined) params = params.set('page', filters.page.toString());
      if (filters.size !== undefined) params = params.set('size', filters.size.toString());
      if (filters.userId !== undefined) params = params.set('userId', filters.userId.toString());
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.medicineId !== undefined) params = params.set('medicineId', filters.medicineId.toString());
    }

    return this.http.get<CalendarEventsResponse>(`${environment.apiUrl}/calendar/events`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getEventById(id: number): Observable<CalendarEvent> {
    return this.http.get<CalendarEvent>(`${environment.apiUrl}/calendar/events/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createEvent(event: CreateEventRequest): Observable<CalendarEvent> {
    return this.http.post<CalendarEvent>(`${environment.apiUrl}/calendar/events`, event)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateEvent(id: number, event: UpdateEventRequest): Observable<CalendarEvent> {
    return this.http.put<CalendarEvent>(`${environment.apiUrl}/calendar/events/${id}`, event)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/calendar/events/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAiSuggestion(request: AiSuggestionRequest): Observable<AiSuggestionResponse> {
    return this.http.post<AiSuggestionResponse>(`${environment.apiUrl}/calendar/ai-suggest`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error con el calendario';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 404) {
        errorMessage = 'Evento no encontrado';
      } else if (error.status === 409) {
        errorMessage = 'Conflicto de horario';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado para acceder al calendario';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para esta acción';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}