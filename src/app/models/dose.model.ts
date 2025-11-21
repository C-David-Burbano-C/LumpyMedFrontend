import { Medicine } from './medicine.model';

export interface DoseRequest {
  medicineName: string;
  weightKg: number;
  userConcentrationMg?: number;
  userConcentrationMl?: number;
}

export interface DoseResponse {
  medicine: string; // Backend returns medicine name as string
  weightKg: number;
  mgPerDay: number;
  dosesPerDay: number;
  mgPerDose: number;
  mlPerDose: number;
  alert: string;
  safeRange: string;
}

export interface DoseResult extends Omit<DoseResponse, 'medicine'> {
  medicine: Medicine; // For UI display with complete medicine object
}

export interface DoseHistoryItem {
  id: number;
  medicine: string;
  weightKg: number;
  mgPerDay: number;
  dosesPerDay: number;
  mgPerDose: number;
  mlPerDose: number;
  alert: string;
  safeRange: string;
  createdAt: string;
}
