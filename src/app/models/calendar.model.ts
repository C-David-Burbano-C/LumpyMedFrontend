export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  medicineId?: number;
  userId?: number;
  aiSuggestion?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  medicineId?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  medicineId?: number;
}

export interface AiSuggestionRequest {
  medicineId: number;
  patientAge: number;
}

export interface AiSuggestionResponse {
  suggestion: string;
}