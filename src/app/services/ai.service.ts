import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AiRequest {
  prompt: string;
}

export interface AiResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly apiKey = 'AIzaSyCa0r40dSVotSAmMIlObaw-4OGGhRVSV4U';
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(private http: HttpClient) {}

  generateResponse(prompt: string): Observable<AiResponse> {
    const url = `${this.apiUrl}?key=${this.apiKey}`;

    const body = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(url, body, { headers })
      .pipe(
        map((response: any) => ({
          response: response.candidates[0].content.parts[0].text
        })),
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    let errorMessage = 'Error al generar respuesta de IA';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 400) {
        errorMessage = 'Prompt inválido para la IA';
      } else if (error.status === 429) {
        errorMessage = 'Límite de requests excedido';
      } else if (error.error && error.error.error) {
        errorMessage = error.error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}