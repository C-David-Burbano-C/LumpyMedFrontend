import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { MedicineSelection, MedicineSelectionRequest } from '../models/medicine-selection.model';

@Injectable({
  providedIn: 'root'
})
export class MedicineSelectionService {
  private medicineSelectionsSubject = new BehaviorSubject<MedicineSelection[]>([]);
  public medicineSelections$ = this.medicineSelectionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserSelections();
  }

  // Load selections from localStorage (client-side storage for now)
  loadUserSelections(): void {
    const selections = localStorage.getItem('medicineSelections');
    if (selections) {
      this.medicineSelectionsSubject.next(JSON.parse(selections));
    }
  }

  // Get all user selections
  getUserSelections(): Observable<MedicineSelection[]> {
    return this.medicineSelections$;
  }

  // Get selections from local storage
  getLocalSelections(): MedicineSelection[] {
    return this.medicineSelectionsSubject.value;
  }

  // Add or update a medicine selection
  addOrUpdateSelection(selection: MedicineSelection): void {
    const selections = this.medicineSelectionsSubject.value;
    const existingIndex = selections.findIndex(s => s.medicineId === selection.medicineId);

    if (existingIndex >= 0) {
      // Update existing
      selections[existingIndex] = { ...selections[existingIndex], ...selection };
    } else {
      // Add new
      selections.push(selection);
    }

    this.medicineSelectionsSubject.next(selections);
    this.saveSelectionsToLocalStorage(selections);
  }

  // Remove a medicine selection
  removeSelection(medicineId: number): void {
    const selections = this.medicineSelectionsSubject.value.filter(
      s => s.medicineId !== medicineId
    );
    this.medicineSelectionsSubject.next(selections);
    this.saveSelectionsToLocalStorage(selections);
  }

  // Update quantity for a medicine
  updateQuantity(medicineId: number, quantity: number): void {
    const selections = this.medicineSelectionsSubject.value;
    const selection = selections.find(s => s.medicineId === medicineId);
    
    if (selection) {
      selection.quantity = quantity;
      this.medicineSelectionsSubject.next([...selections]);
      this.saveSelectionsToLocalStorage(selections);
    }
  }

  // Clear all selections
  clearAllSelections(): void {
    this.medicineSelectionsSubject.next([]);
    localStorage.removeItem('medicineSelections');
  }

  // Save selections to local storage
  private saveSelectionsToLocalStorage(selections: MedicineSelection[]): void {
    localStorage.setItem('medicineSelections', JSON.stringify(selections));
  }

  // Get total count of selected medicines
  getTotalSelectedCount(): number {
    return this.medicineSelectionsSubject.value.length;
  }

  // Get total quantity
  getTotalQuantity(): number {
    return this.medicineSelectionsSubject.value.reduce((sum, s) => sum + s.quantity, 0);
  }
}
