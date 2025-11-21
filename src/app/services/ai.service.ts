import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, switchMap, timeout } from 'rxjs/operators';
import { MedicineKnowledge, MedicineKnowledgeService } from './medicine-knowledge.service';

export interface MedicalAdviceRequest {
  medicineName: string;
  patientWeight: number;
  dailyDose: number;
  dosesPerDay: number;
  dosePerAdministration: number;
  volumePerDose: number;
  safeRange: string;
  alert: string;
  medicineDescription?: string;
}

export interface AiResponse {
  advice: string;
  recommendations: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly apiKey = 'AIzaSyCa0r40dSVotSAmMIlObaw-4OGGhRVSV4U';
  private readonly apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly modelName = 'models/gemini-flash-latest';
  private readonly requestTimeoutMs = 15000;

  constructor(
    private readonly http: HttpClient,
    private readonly medicineKnowledge: MedicineKnowledgeService
  ) {}

  generateMedicalAdvice(request: MedicalAdviceRequest): Observable<AiResponse> {
    return this.medicineKnowledge.fetchKnowledge(request.medicineName).pipe(
      switchMap((knowledge) => {
        const prompt = this.buildMedicalPrompt(request, knowledge);
        const url = `${this.apiBaseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
        const body = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.6,
            topP: 0.9,
            topK: 32,
            maxOutputTokens: 512
          }
        };

        return this.http.post<GeminiResponse>(url, body).pipe(
          timeout(this.requestTimeoutMs),
          retry(1),
          map((result) => {
            const text = this.extractTextFromResponse(result);
            const parsed = this.parseMedicalAdvice(text, result);
            return this.ensureAdvice(parsed, request);
          })
        );
      }),
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('El servicio de IA tardó demasiado en responder. Intenta nuevamente.'));
        }
        return throwError(() => new Error('Error al generar consejos médicos. Por favor, consulte a un profesional de la salud.'));
      })
    );
  }

  private extractTextFromResponse(response: GeminiResponse): string {
    const candidate = response.candidates?.[0];
    if (!candidate) {
      return '';
    }

    const parts = candidate.content?.parts || [];
    return parts
      .map((part) => part.text?.trim() || '')
      .filter((text) => text.length > 0)
      .join('\n');
  }

  private buildMedicalPrompt(request: MedicalAdviceRequest, knowledge?: MedicineKnowledge | null): string {
    const knowledgeBlock = knowledge
      ? `Información farmacológica encontrada:
- Clase/mecanismo principal: ${knowledge.mechanism || 'No identificado'}
- Indicaciones conocidas: ${this.formatList(knowledge.indications, 'No registradas')}
- Contraindicaciones reportadas: ${this.formatList(knowledge.contraindications, 'No registradas')}
- Usa las contraindicaciones listadas como base para PRECAUCIONES si aplican al caso.
`
      : `No se encontró evidencia farmacológica confiable para "${request.medicineName}". Si el medicamento no es reconocible, deja las listas vacías y explica en "observaciones" que no hay información verificada.
`;

    // Nota: La información farmacológica se obtiene investigando en bases de datos públicas como RxNav (NIH):
    // - Mecanismo: Describe cómo actúa el medicamento en el cuerpo (ej. inhibidor de COX-2)
    // - Indicaciones: Para qué sirve el medicamento (ej. tratamiento de fiebre, dolor, inflamación)
    // - Contraindicaciones: Cuándo NO usar el medicamento (ej. alergia al principio activo, embarazo)

    return `Eres un asistente médico pediátrico. Cruza la dosis calculada con la información oficial del fármaco y prioriza la seguridad.

Datos del caso:
- Medicamento: ${request.medicineName}
- Descripción proporcionada: ${request.medicineDescription || 'No disponible'}
- Peso del paciente: ${request.patientWeight} kg
- Dosis diaria total: ${request.dailyDose} mg
- Frecuencia diaria: ${request.dosesPerDay} dosis
- Dosis por administración: ${request.dosePerAdministration} mg
- Volumen por dosis: ${request.volumePerDose} ml
- Rango seguro: ${request.safeRange}
- Estado actual: ${request.alert}

${knowledgeBlock}
Devuelve ÚNICAMENTE un objeto JSON válido (sin texto adicional, ni explicaciones, ni markdown) con esta forma:
{
  "consejos": ["texto", "texto"],
  "recomendaciones": ["texto"],
  "precauciones": ["texto"],
  "observaciones": "texto opcional"
}

Reglas:
- Las listas deben tener máximo 4 puntos cada una.
- Usa oraciones cortas y específicas para cuidadores.
- Si no hay datos del medicamento, responde "Sin información farmacológica verificable para ${request.medicineName}" en observaciones y evita inventar datos.
- Si falta información del paciente, indica la precaución correspondiente.
- No agregues recordatorios legales, eso ya lo muestra la aplicación.`;
  }

  private formatList(values: string[], emptyFallback: string): string {
    return values && values.length ? values.join(', ') : emptyFallback;
  }

  private parseMedicalAdvice(aiText: string, response?: GeminiResponse): AiResponse {
    const advice: AiResponse = {
      advice: '',
      recommendations: [],
      warnings: []
    };

    if (!aiText) {
      const finishReason = response?.candidates?.[0]?.finishReason;
      advice.advice = finishReason === 'SAFETY'
        ? 'La respuesta de la IA fue bloqueada por las políticas de seguridad. Revisa los datos ingresados.'
        : 'La IA no proporcionó contenido. Intenta nuevamente en unos instantes.';
      return advice;
    }

    try {
      const structured = this.parseJsonAdvice(aiText);
      if (structured) {
        advice.advice = structured.consejos.join('\n');
        advice.recommendations = structured.recomendaciones;
        advice.warnings = structured.precauciones;
        if (!advice.advice && structured.observaciones) {
          advice.advice = structured.observaciones;
        }
        if (advice.advice || advice.recommendations.length || advice.warnings.length) {
          return advice;
        }
      }

      // Fallback to legacy section parsing if JSON missing
      const consejosMatch = aiText.match(/CONSEJOS:\s*([\s\S]*?)(?=RECOMENDACIONES:|$)/i);
      const recomendacionesMatch = aiText.match(/RECOMENDACIONES:\s*([\s\S]*?)(?=PRECAUCIONES:|$)/i);
      const precaucionesMatch = aiText.match(/PRECAUCIONES:\s*([\s\S]*?)$/i);

      if (consejosMatch) {
        const consejos = this.extractListItems(consejosMatch[1]);
        advice.advice = consejos.length ? consejos.join('\n') : consejosMatch[1].trim();
      }

      if (recomendacionesMatch) {
        advice.recommendations = this.extractListItems(recomendacionesMatch[1]);
      }

      if (precaucionesMatch) {
        advice.warnings = this.extractListItems(precaucionesMatch[1]);
      }

      if (!advice.advice && !advice.recommendations.length && !advice.warnings.length) {
        advice.advice = aiText;
      }

    } catch (error) {
      advice.advice = aiText || 'No se pudo interpretar la respuesta del servicio de IA.';
    }

    return advice;
  }

  private ensureAdvice(advice: AiResponse, request: MedicalAdviceRequest): AiResponse {
    const hasRecommendations = advice.recommendations.length > 0;
    const hasWarnings = advice.warnings.length > 0;
    const hasMeaningfulAdvice = advice.advice.trim().length > 0 && !this.isPlaceholderMessage(advice.advice);

    if (hasMeaningfulAdvice || hasRecommendations || hasWarnings) {
      if (!hasRecommendations) {
        advice.recommendations = this.buildDefaultRecommendations(request);
      }
      if (!hasWarnings) {
        advice.warnings = this.buildDefaultWarnings(request);
      }
      if (!hasMeaningfulAdvice) {
        advice.advice = this.buildDefaultAdviceText(request);
      }
      return advice;
    }

    return {
      advice: this.buildDefaultAdviceText(request),
      recommendations: this.buildDefaultRecommendations(request),
      warnings: this.buildDefaultWarnings(request)
    };
  }

  private isPlaceholderMessage(text: string): boolean {
    const normalized = text.toLowerCase();
    return normalized.includes('la ia no proporcionó') || normalized.includes('respuesta de la ia fue bloqueada');
  }

  private buildDefaultAdviceText(request: MedicalAdviceRequest): string {
    return `Administra ${request.dosePerAdministration.toFixed(2)} mg (${request.volumePerDose.toFixed(2)} ml) por toma, ${request.dosesPerDay} veces al día, respetando el rango seguro ${request.safeRange}. Mantén hidratado al paciente y verifica que tolere la medicación.`;
  }

  private buildDefaultRecommendations(request: MedicalAdviceRequest): string[] {
    return [
      'Confirma el peso del paciente antes de cada ajuste de dosis.',
      `Utiliza una jeringa oral para medir ${request.volumePerDose.toFixed(2)} ml por dosis sin exceder el rango ${request.safeRange}.`,
      'Observa signos de mejoría dentro de las primeras 48 horas y registra cada administración.'
    ];
  }

  private buildDefaultWarnings(request: MedicalAdviceRequest): string[] {
    return [
      'Suspende el medicamento y consulta al pediatra si aparecen vómitos persistentes, erupciones o dificultad respiratoria.',
      'No combines este fármaco con otros que contengan el mismo principio activo sin indicación médica.',
      `Si una dosis se omite y faltan menos de 4 horas para la siguiente, no dupliques ${request.dosePerAdministration.toFixed(2)} mg.`
    ];
  }

  private parseJsonAdvice(raw: string): { consejos: string[]; recomendaciones: string[]; precauciones: string[]; observaciones?: string } | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = jsonMatch ? jsonMatch[1] : trimmed;

    try {
      const parsed = JSON.parse(jsonText);
      return {
        consejos: this.ensureStringArray(parsed.consejos || parsed.advice || []),
        recomendaciones: this.ensureStringArray(parsed.recomendaciones || parsed.recommendations || []),
        precauciones: this.ensureStringArray(parsed.precauciones || parsed.warnings || []),
        observaciones: typeof parsed.observaciones === 'string' ? parsed.observaciones.trim() : undefined
      };
    } catch {
      return null;
    }
  }

  private ensureStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((text) => !!text);
    }
    if (typeof value === 'string') {
      return value.split(/\n|\r/).map((item) => item.trim()).filter((text) => !!text);
    }
    return [];
  }

  private extractListItems(text: string): string[] {
    const items: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        const cleaned = trimmed.replace(/^(-|•|\d+\.)\s*/, '').trim();
        if (cleaned) {
          items.push(cleaned);
        }
      } else {
        items.push(trimmed);
      }
    }

    return items;
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
}