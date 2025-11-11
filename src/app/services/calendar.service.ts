import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CalendarEvent, CreateEventRequest, UpdateEventRequest, AiSuggestionRequest, AiSuggestionResponse } from '../models/calendar.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${environment.apiUrl}/calendar/events`)
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
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}