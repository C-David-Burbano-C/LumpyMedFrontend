import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface MedicineKnowledge {
  mechanism?: string;
  indications: string[];
  contraindications: string[];
}

interface RxcuiResponse {
  idGroup?: {
    rxnormId?: string[];
  };
}

interface RxClassResponse {
  rxclassDrugInfoList?: {
    rxclassDrugInfo?: RxClassDrugInfo[];
  };
}

interface RxClassDrugInfo {
  rela?: string;
  rxclassMinConceptItem?: {
    className?: string;
    classType?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MedicineKnowledgeService {
  private readonly baseUrl = 'https://rxnav.nlm.nih.gov/REST';

  constructor(private readonly http: HttpClient) {}

  fetchKnowledge(medicineName: string): Observable<MedicineKnowledge | null> {
    const normalized = medicineName?.trim();
    if (!normalized) {
      return of(null);
    }

    const params = new HttpParams().set('name', normalized);

    return this.http.get<RxcuiResponse>(`${this.baseUrl}/rxcui.json`, { params }).pipe(
      map((response) => response.idGroup?.rxnormId?.[0] || null),
      switchMap((rxcui) => {
        if (!rxcui) {
          return of(null);
        }
        const knowledgeParams = new HttpParams()
          .set('rxcui', rxcui)
          .set('relaSource', 'MEDRT');
        return this.http.get<RxClassResponse>(`${this.baseUrl}/rxclass/class/byRxcui.json`, { params: knowledgeParams });
      }),
      map((response) => this.toKnowledge(response)),
      catchError((error) => {
        console.warn('No se pudo ampliar la información del medicamento', error);
        return of(null);
      })
    );
  }

  private toKnowledge(response: RxClassResponse | null): MedicineKnowledge | null {
    const entries = response?.rxclassDrugInfoList?.rxclassDrugInfo || [];
    if (!entries.length) {
      return null;
    }

    const indications = this.extractByRelation(entries, ['may_treat', 'may_prevent'], 'DISEASE');
    const contraindications = this.extractByRelation(entries, ['ci_with'], 'DISEASE');
    const mechanism = this.extractFirstByType(entries, 'MOA');

    if (!indications.length && !contraindications.length && !mechanism) {
      return null;
    }

    return {
      mechanism: mechanism || undefined,
      indications: indications.slice(0, 5),
      contraindications: contraindications.slice(0, 4)
    };
  }

  private extractByRelation(entries: RxClassDrugInfo[], relations: string[], classType: string): string[] {
    const unique = new Set<string>();

    for (const entry of entries) {
      const relationMatches = entry.rela ? relations.includes(entry.rela) : false;
      const sameType = entry.rxclassMinConceptItem?.classType === classType;
      const className = entry.rxclassMinConceptItem?.className?.trim();

      if (relationMatches && sameType && className) {
        unique.add(className);
      }
    }

    return Array.from(unique);
  }

  private extractFirstByType(entries: RxClassDrugInfo[], classType: string): string | null {
    const match = entries.find((entry) => entry.rxclassMinConceptItem?.classType === classType);
    return match?.rxclassMinConceptItem?.className?.trim() || null;
  }
}
