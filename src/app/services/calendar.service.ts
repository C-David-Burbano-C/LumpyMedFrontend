import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CalendarEvent, CreateEventRequest, UpdateEventRequest, AiSuggestionRequest, AiSuggestionResponse, CalendarEventsResponse, CalendarFilters } from '../models/calendar.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly STORAGE_KEY = 'calendar_events';

  constructor() {
    // Initialize localStorage if empty
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  getAllEvents(filters?: CalendarFilters): Observable<CalendarEventsResponse> {
    try {
      const events: CalendarEvent[] = this.getStoredEvents();
      let filteredEvents = [...events];

      // Apply filters
      if (filters) {
        if (filters.userId !== undefined) {
          filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
        }
        if (filters.medicineId !== undefined) {
          filteredEvents = filteredEvents.filter(event => event.medicineId === filters.medicineId);
        }
        if (filters.startDate) {
          filteredEvents = filteredEvents.filter(event => 
            new Date(event.startDate) >= new Date(filters.startDate!)
          );
        }
        if (filters.endDate) {
          filteredEvents = filteredEvents.filter(event => 
            new Date(event.endDate) <= new Date(filters.endDate!)
          );
        }
      }

      // Apply pagination
      const page = filters?.page || 0;
      const size = filters?.size || 10;
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      const response: CalendarEventsResponse = {
        content: paginatedEvents,
        totalElements: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / size),
        size: size,
        number: page,
        numberOfElements: paginatedEvents.length,
        first: page === 0,
        last: endIndex >= filteredEvents.length,
        empty: paginatedEvents.length === 0
      };

      return of(response).pipe(delay(300)); // Simulate network delay
    } catch (error) {
      return throwError(() => new Error('Error al cargar eventos del calendario'));
    }
  }

  getEventById(id: number): Observable<CalendarEvent> {
    try {
      const events = this.getStoredEvents();
      const event = events.find(e => e.id === id);
      
      if (!event) {
        return throwError(() => new Error('Evento no encontrado'));
      }

      return of(event).pipe(delay(200));
    } catch (error) {
      return throwError(() => new Error('Error al obtener evento'));
    }
  }

  createEvent(eventData: CreateEventRequest): Observable<CalendarEvent> {
    try {
      const events = this.getStoredEvents();
      const newEvent: CalendarEvent = {
        ...eventData,
        id: this.generateId(),
        userId: eventData.userId || 1, // Default user ID if not provided
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      events.push(newEvent);
      this.saveEvents(events);

      return of(newEvent).pipe(delay(500)); // Simulate network delay
    } catch (error) {
      return throwError(() => new Error('Error al crear evento'));
    }
  }

  updateEvent(id: number, eventData: UpdateEventRequest): Observable<CalendarEvent> {
    try {
      const events = this.getStoredEvents();
      const eventIndex = events.findIndex(e => e.id === id);

      if (eventIndex === -1) {
        return throwError(() => new Error('Evento no encontrado'));
      }

      const updatedEvent: CalendarEvent = {
        ...events[eventIndex],
        ...eventData,
        id: id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      events[eventIndex] = updatedEvent;
      this.saveEvents(events);

      return of(updatedEvent).pipe(delay(400));
    } catch (error) {
      return throwError(() => new Error('Error al actualizar evento'));
    }
  }

  deleteEvent(id: number): Observable<void> {
    try {
      const events = this.getStoredEvents();
      const filteredEvents = events.filter(e => e.id !== id);

      if (filteredEvents.length === events.length) {
        return throwError(() => new Error('Evento no encontrado'));
      }

      this.saveEvents(filteredEvents);
      return of(void 0).pipe(delay(300));
    } catch (error) {
      return throwError(() => new Error('Error al eliminar evento'));
    }
  }

  getAiSuggestion(request: AiSuggestionRequest): Observable<AiSuggestionResponse> {
    // Mock AI suggestion for now
    const suggestions = [
      'Recuerda tomar el medicamento con alimentos',
      'No combines con otros medicamentos sin consultar al médico',
      'Mantén una rutina consistente de dosificación',
      'Almacena en lugar fresco y seco'
    ];

    const response: AiSuggestionResponse = {
      suggestion: suggestions[Math.floor(Math.random() * suggestions.length)],
      optimalTimes: ['08:00', '14:00', '20:00'], // Mock optimal times
      warnings: ['No mezclar con alcohol', 'Tomar con alimentos'], // Mock warnings
      confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };

    return of(response).pipe(delay(1000)); // Simulate AI processing time
  }

  private getStoredEvents(): CalendarEvent[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveEvents(events: CalendarEvent[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
  }

  private generateId(): number {
    const events = this.getStoredEvents();
    const maxId = events.length > 0 ? Math.max(...events.map(e => e.id || 0)) : 0;
    return maxId + 1;
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