export interface Medicine {
  id?: number;
  name: string;
  description?: string;
  mgKgDay: number;
  dosesPerDay: number;
  concentrationMg: number;
  concentrationMl: number;
  minSafeMl: number;
  maxSafeMl: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMedicineRequest {
  name: string;
  description?: string;
  mgKgDay: number;
  dosesPerDay: number;
  concentrationMg: number;
  concentrationMl: number;
  minSafeMl: number;
  maxSafeMl: number;
}

export interface UpdateMedicineRequest {
  name?: string;
  description?: string;
  mgKgDay?: number;
  dosesPerDay?: number;
  concentrationMg?: number;
  concentrationMl?: number;
  minSafeMl?: number;
  maxSafeMl?: number;
}

export interface MedicinePage {
  content: Medicine[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
