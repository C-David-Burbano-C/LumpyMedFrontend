export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  medicineId: number;
  userId: number;
  aiSuggestion?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  medicineId: number;
  userId?: number;
  aiSuggestion?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  medicineId?: number;
  aiSuggestion?: string;
}

export interface AiSuggestionRequest {
  medicineId: number;
  patientAge: number;
  currentTime?: string;
}

export interface AiSuggestionResponse {
  suggestion: string;
  optimalTimes: string[];
  warnings: string[];
}

export interface CalendarEventsResponse {
  content: CalendarEvent[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CalendarFilters {
  page?: number;
  size?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
  medicineId?: number;
}