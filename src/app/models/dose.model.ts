export interface DoseRequest {
  medicineName: string;
  weightKg: number;
  userConcentrationMg?: number;
  userConcentrationMl?: number;
}

export interface DoseResponse {
  medicine: string;
  weightKg: number;
  mgPerDay: number;
  dosesPerDay: number;
  mgPerDose: number;
  mlPerDose: number;
  alert: string;
  safeRange: string;
}
