export interface MedicineSelection {
  id?: number;
  userId: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  dosage: string;
  concentration: string;
  presentation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicineSelectionRequest {
  medicineId: number;
  quantity: number;
}

export interface UserMedicineSelections {
  userId: number;
  selections: MedicineSelection[];
  lastUpdated: string;
}
